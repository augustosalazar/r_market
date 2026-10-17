import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { messageOf } from "@/src/core/utils/formatters";
import { useAsyncData } from "@/src/core/utils/useAsyncData";
import { useSession } from "@/src/features/auth/presentation/context/SessionContext";
import { ListingRepository } from "../../domain/repositories/ListingRepository";

type FollowsViewModel = {
  // Los ids de las publicaciones que sigue quien está dentro.
  ids: Set<string>;
  isFollowing: (listingId: string) => boolean;
  // Devuelve si quedó siguiendo, o `null` si no llegó a haber sesión.
  toggle: (listingId: string) => Promise<boolean | null>;
};

const EMPTY = new Set<string>();

const FollowsContext = createContext<FollowsViewModel | undefined>(undefined);

// Quién sigue qué, en un solo sitio. La estrella se toca en el catálogo y en el
// detalle, y la lista «Lo mío → Siguiendo» la muestra: si cada pantalla guardara
// su copia, discreparían.
export function FollowsProvider({ children }: { children: React.ReactNode }) {
  const listings = useInject<ListingRepository>(TOKENS.ListingRepo);
  const session = useSession();
  const snackbar = useSnackbar();
  const userId = session.user?.userId ?? null;
  const fetchIds = useCallback(
    async () => (userId ? listings.followedIds(userId) : new Set<string>()),
    [listings, userId],
  );
  const { data: fetched } = useAsyncData(fetchIds, new Set<string>());

  // Lo que se tocó aquí, encima de lo que dijo el servidor. Así la estrella no
  // se deshace si una lectura vieja llega tarde (por ejemplo, la que dispara
  // entrar como invitado en el mismo toque). Es de un usuario: si cambia, sobra.
  const [local, setLocal] = useState<{ owner: string; changes: Map<string, boolean> } | null>(null);
  const ids = useMemo(() => {
    if (!userId) return EMPTY;
    if (!local || local.owner !== userId) return fetched;
    const merged = new Set(fetched);
    local.changes.forEach((following, id) => (following ? merged.add(id) : merged.delete(id)));
    return merged;
  }, [fetched, local, userId]);

  const { ensureWritableSession, currentUser } = session;
  const toggle = useCallback(
    async (listingId: string) => {
      // Seguir no exige cuenta: una sesión de invitado vale.
      if (!(await ensureWritableSession())) return null;
      const me = currentUser();
      if (!me) return null;
      try {
        const following = await listings.toggleFollow(listingId, me.userId);
        setLocal((prev) => {
          const changes = new Map(prev?.owner === me.userId ? prev.changes : undefined);
          changes.set(listingId, following);
          return { owner: me.userId, changes };
        });
        return following;
      } catch (e) {
        snackbar(messageOf(e), { error: true });
        return null;
      }
    },
    [currentUser, ensureWritableSession, listings, snackbar],
  );

  const value = useMemo(() => ({ ids, isFollowing: (id: string) => ids.has(id), toggle }), [ids, toggle]);
  return <FollowsContext.Provider value={value}>{children}</FollowsContext.Provider>;
}

export function useFollows() {
  const ctx = useContext(FollowsContext);
  if (!ctx) throw new Error("useFollows must be used inside FollowsProvider");
  return ctx;
}
