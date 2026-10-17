import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";

import { useAsyncData } from "@/src/core/utils/useAsyncData";

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
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const repo = useInject<NotificationRepository>(TOKENS.NotificationRepo);
  const userId = useSession().user?.userId ?? null;
  const fetchInbox = useCallback(async () => (userId ? repo.inbox() : []), [repo, userId]);
  // Sin bandeja no hay nada que mostrar; no es motivo para romper la app.
  const { data, setData: setItems, loading, reload } = useAsyncData<AppNotification[]>(fetchInbox, []);
  const items = userId ? data : NONE;

  // Primero se lee y luego se escucha: el socket no reenvía lo que ya estaba.
  useEffect(() => {
    if (!userId) return;
    return repo.watch((n) => setItems((prev) => (prev.some((p) => p.id === n.id) ? prev : [n, ...prev])));
  }, [repo, userId, setItems]);

  const refresh = useCallback(async () => reload(), [reload]);

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
