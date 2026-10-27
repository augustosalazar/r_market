import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { useSession } from "@/src/features/auth/presentation/context/SessionContext";
import { AppNotification } from "../../domain/entities/AppNotification";
import { NotificationRepository } from "../../domain/repositories/NotificationRepository";

type NotificationsViewModel = {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (n: AppNotification) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NONE: AppNotification[] = [];

const NotificationsContext = createContext<NotificationsViewModel | undefined>(undefined);

// La bandeja de quien está dentro. Se resuscribe sola cuando cambia la sesión y
// cancela la escucha al cerrarla: un socket vivo sin cancelar se queda abierto.
//
// Secuencia: cada vez que cambia quién está dentro, se le pide al repositorio
// la bandeja → se guarda en el estado → se empieza a escuchar lo nuevo. Las
// acciones (marcar leído) cambian el estado y luego avisan al repositorio.
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const repo = useInject<NotificationRepository>(TOKENS.NotificationRepo);
  const userId = useSession().user?.userId ?? null;

  // ── Estado que leen las pantallas ─────────────────────────
  const [inbox, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const items = userId ? inbox : NONE;

  // Número de turno de la última carga: si cambia la sesión a medias, la
  // respuesta de un turno viejo no vale.
  const loadTicket = useRef(0);

  // ── Cargas: aquí se llama al repositorio ──────────────────

  // Estable (useCallback): el contexto se reparte a toda la app, y una función
  // nueva en cada render redibujaría a todos los que lo leen.
  const fetchInbox = useCallback(async () => {
    const id = ++loadTicket.current;
    try {
      const result = userId ? await repo.inbox() : [];
      if (id === loadTicket.current) setItems(result);
    } catch {
      // Sin bandeja no hay nada que mostrar; no es motivo para romper la app.
    } finally {
      if (id === loadTicket.current) setLoading(false);
    }
  }, [repo, userId]);

  // Al arrancar y cada vez que cambia quién está dentro.
  // (La regla de abajo no ve que el estado cambia después del `await`, no al
  // instante; por eso se desactiva aquí.)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInbox();
  }, [fetchInbox]);

  // Primero se lee y luego se escucha: el socket no reenvía lo que ya estaba.
  useEffect(() => {
    if (!userId) return;
    return repo.watch((n) => setItems((prev) => (prev.some((p) => p.id === n.id) ? prev : [n, ...prev])));
  }, [repo, userId]);

  // ── Acciones que llaman las pantallas ─────────────────────

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchInbox();
  }, [fetchInbox]);

  const markRead = useCallback(
    async (n: AppNotification) => {
      if (n.read) return;
      setItems((prev) => prev.map((p) => (p.id === n.id ? { ...p, read: true } : p)));
      await repo.markRead(n.id).catch(() => {});
    },
    [repo, setItems],
  );

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((p) => ({ ...p, read: true })));
    await repo.markAllRead().catch(() => {});
  }, [repo, setItems]);

  const value = useMemo(
    () => ({ items, unreadCount: items.filter((n) => !n.read).length, loading, refresh, markRead, markAllRead }),
    [items, loading, refresh, markRead, markAllRead],
  );
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}
