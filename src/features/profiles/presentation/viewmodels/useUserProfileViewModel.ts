import { useCallback, useEffect, useMemo, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { useAsyncData } from "@/src/core/utils/useAsyncData";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { messageOf } from "@/src/core/utils/formatters";
import { useSession } from "@/src/features/auth/presentation/context/SessionContext";
import { CarListing } from "@/src/features/listings/domain/entities/CarListing";
import { ListingRepository } from "@/src/features/listings/domain/repositories/ListingRepository";
import { RatedRole, UserRating } from "../../domain/entities/UserRating";
import { RatingRepository } from "../../domain/repositories/RatingRepository";

// Una venta que quien mira todavía puede calificar. `role` es el papel de la
// **persona del perfil** en esa venta.
export type PendingRating = { listing: CarListing; role: RatedRole };

// El perfil público: lo que vende, vendió y compró, y lo que opinan de ella. Se
// mira sin sesión; calificar exige cuenta y una venta con esa persona.
export function useUserProfileViewModel(userId: string) {
  const listings = useInject<ListingRepository>(TOKENS.ListingRepo);
  const ratings = useInject<RatingRepository>(TOKENS.RatingRepo);
  const session = useSession();
  const snackbar = useSnackbar();

  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    const [published, bought, received] = await Promise.all([
      listings.bySeller(userId),
      listings.purchasesOf(userId),
      ratings.receivedBy(userId),
    ]);
    return {
      selling: published.filter((l) => l.status !== "sold"),
      sold: published.filter((l) => l.status === "sold"),
      bought,
      received,
    };
  }, [listings, ratings, userId]);
  const { data, setData, loading, error, reload } = useAsyncData<{
    selling: CarListing[];
    sold: CarListing[];
    bought: CarListing[];
    received: UserRating[];
  }>(fetchProfile, { selling: [], sold: [], bought: [], received: [] });
  const { selling, sold, bought, received } = data;

  useEffect(() => {
    if (error) snackbar(error, { error: true });
  }, [error, snackbar]);

  // El promedio, o `null` si nadie la ha calificado: no es lo mismo que un cero.
  const average = received.length === 0 ? null : received.reduce((s, r) => s + r.stars, 0) / received.length;

  const me = session.user?.userId ?? null;
  // Las ventas entre quien mira y esta persona que aún no ha calificado.
  const pending = useMemo<PendingRating[]>(() => {
    if (!me || me === userId) return [];
    const done = new Set(received.filter((r) => r.raterId === me).map((r) => r.listingId));
    return [
      ...sold.filter((l) => l.buyerId === me && !done.has(l.id)).map((listing) => ({ listing, role: "seller" as const })),
      ...bought.filter((l) => l.sellerId === me && !done.has(l.id)).map((listing) => ({ listing, role: "buyer" as const })),
    ];
  }, [bought, me, received, sold, userId]);

  const rate = async (p: PendingRating, stars: number, comment: string) => {
    if (!session.ensureLoggedIn()) return;
    const rater = session.currentUser();
    if (!rater) return;
    setSaving(true);
    try {
      await ratings.rate({
        listingId: p.listing.id,
        raterId: rater.userId,
        raterName: rater.name,
        ratedId: userId,
        ratedRole: p.role,
        stars,
        comment: comment.trim(),
      });
      const updated = await ratings.receivedBy(userId);
      setData((d) => ({ ...d, received: updated }));
      snackbar("Gracias: tu calificación ya está publicada.");
    } catch (e) {
      snackbar(messageOf(e), { error: true });
    } finally {
      setSaving(false);
    }
  };

  return { selling, sold, bought, received, loading, saving, average, pending, refresh: reload, rate };
}
