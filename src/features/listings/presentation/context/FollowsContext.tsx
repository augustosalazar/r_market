import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { messageOf } from "@/src/core/utils/formatters";
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
//
// Secuencia: cada vez que cambia quién está dentro, se le piden al repositorio
// sus seguidas → se guardan en el estado → las pantallas que lo leen se
// redibujan. `toggle` llama al repositorio y anota el cambio.
export function FollowsProvider({ children }: { children: React.ReactNode }) {
  const listings = useInject<ListingRepository>(TOKENS.ListingRepo);
  const session = useSession();
  const snackbar = useSnackbar();
  const userId = session.user?.userId ?? null;

  // ── Estado ────────────────────────────────────────────────
  // Lo que dijo el servidor.
  const [fetched, setFetched] = useState<Set<string>>(EMPTY);
  // Número de turno de la última carga: si cambia la sesión a medias, la
  // respuesta de un turno viejo no vale.
  const loadTicket = useRef(0);

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

  // ── Cargas: aquí se llama al repositorio ──────────────────

  const fetchIds = async () => {
    const id = ++loadTicket.current;
    try {
      const result = userId ? await listings.followedIds(userId) : EMPTY;
      if (id === loadTicket.current) setFetched(result);
    } catch {
      // Sin la lista no se marca ninguna estrella; no es motivo para avisar.
    }
  };

  // Al arrancar y cada vez que cambia quién está dentro.
  // (La regla de abajo no ve que el estado cambia después del `await`, no al
  // instante; por eso se desactiva aquí.)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── Acciones ──────────────────────────────────────────────

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
