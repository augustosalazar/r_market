import { useCallback, useRef, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { messageOf } from "@/src/core/utils/formatters";
import { useSession } from "@/src/features/auth/presentation/context/SessionContext";
import { ChatRepository } from "@/src/features/chat/domain/repositories/ChatRepository";
import { NotificationDispatcher } from "@/src/features/notifications/domain/repositories/NotificationRepository";
import { CarListing, ListingStatus, statusLabel } from "../../domain/entities/CarListing";
import { ListingRepository } from "../../domain/repositories/ListingRepository";
import { useFollows } from "../context/FollowsContext";
import { notifyStatusChange } from "../listingNotices";

// Lo mío: lo que vendo y lo que sigo (que es lo que me genera avisos).
//
// Secuencia: la pantalla llama a `refresh` cada vez que se enfoca → `refresh`
// le pide al repositorio lo que vendo y lo que sigo → el resultado se guarda en
// el estado → la pantalla se vuelve a dibujar.
export function useMyListingsViewModel() {
  const listings = useInject<ListingRepository>(TOKENS.ListingRepo);
  const chats = useInject<ChatRepository>(TOKENS.ChatRepo);
  const dispatcher = useInject<NotificationDispatcher>(TOKENS.NotificationDispatcher);
  const userId = useSession().user?.userId ?? null;
  const followIds = useFollows().ids;
  const snackbar = useSnackbar();

  // ── Estado que lee la pantalla ────────────────────────────
  const [selling, setSelling] = useState<CarListing[]>([]);
  const [following, setFollowing] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Números de turno de la última carga de cada lista: si cambia la sesión a
  // medias, la respuesta de un turno viejo no vale.
  const sellingTicket = useRef(0);
  const followingTicket = useRef(0);

  // ── Cargas: aquí se llama al repositorio ──────────────────

  const fetchSelling = useCallback(async () => {
    const id = ++sellingTicket.current;
    try {
      const result = userId ? await listings.bySeller(userId) : [];
      if (id === sellingTicket.current) setSelling(result);
    } catch (e) {
      if (id === sellingTicket.current) snackbar(messageOf(e), { error: true });
    } finally {
      if (id === sellingTicket.current) setLoading(false);
    }
  }, [listings, snackbar, userId]);

  const fetchFollowing = useCallback(async () => {
    const id = ++followingTicket.current;
    try {
      const result = userId && followIds.size > 0 ? await listings.followedBy(userId) : [];
      if (id === followingTicket.current) setFollowing(result);
    } catch (e) {
      if (id === followingTicket.current) snackbar(messageOf(e), { error: true });
    }
  }, [followIds, listings, snackbar, userId]);

  // ── Acciones que llama la pantalla ────────────────────────

  // Estable (useCallback): la pantalla la llama desde `useFocusEffect`, y una
  // función nueva en cada render la volvería a disparar sin parar. Cambia cuando
  // cambia la sesión o lo que sigo (la estrella se marca en el catálogo y en el
  // detalle), y entonces la pantalla vuelve a pedir.
  const refresh = useCallback(() => {
    setLoading(true);
    fetchSelling();
    fetchFollowing();
  }, [fetchSelling, fetchFollowing]);

  const replace = (updated: CarListing) => setSelling((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));

  const changeStatus = async (listing: CarListing, status: ListingStatus) => {
    try {
      const updated = await listings.changeStatus(listing.id, status);
      replace(updated);
      await notifyStatusChange({ listings, dispatcher }, updated, status);
      snackbar(`Estado actualizado a ${statusLabel[status].toLowerCase()}.`);
    } catch (e) {
      snackbar(messageOf(e), { error: true });
    }
  };

  const markSold = async (listing: CarListing, buyerId: string, buyerName: string) => {
    try {
      const updated = await listings.markSold(listing.id, buyerId, buyerName);
      replace(updated);
      await notifyStatusChange({ listings, dispatcher }, updated, "sold");
      snackbar(`Venta registrada con ${buyerName}.`);
    } catch (e) {
      snackbar(messageOf(e), { error: true });
    }
  };

  // A quién se le pudo haber vendido: quienes abrieron chat sobre ella.
  const buyerCandidates = useCallback(
    async (listing: CarListing) =>
      (await chats.threadsOfListing(listing.id)).filter((t) => t.buyerId !== listing.sellerId),
    [chats],
  );

  return {
    selling: userId ? selling : [],
    following: userId ? following : [],
    loading,
    refresh,
    changeStatus,
    markSold,
    buyerCandidates,
  };
}
