import { AppNotification, NotificationKind } from "../entities/AppNotification";

// La bandeja del usuario con sesión.
export interface NotificationRepository {
  inbox(): Promise<AppNotification[]>;
  // Lo que llegue de ahora en adelante. Devuelve la función para cancelar.
  watch(onNotification: (n: AppNotification) => void): () => void;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

// Quién produce los avisos. Separado de la bandeja porque quien los produce
// puede cambiar (hoy la propia app, mañana el servidor) sin que la bandeja se
// lea distinto.
export interface NotificationDispatcher {
  dispatch(params: {
    userIds: string[];
    kind: NotificationKind;
    title: string;
    body: string;
    listingId?: string;
    threadId?: string;
  }): Promise<void>;
}
