import { RobleNotification } from "roble-client";

import { guardRoble, parseDate } from "@/src/core/roble/guard";
import { AppNotification, NOTIFICATION_KINDS, NotificationKind } from "../../domain/entities/AppNotification";
import { NotificationDispatcher, NotificationRepository } from "../../domain/repositories/NotificationRepository";
import { NotificationDataSource } from "../datasources/NotificationDataSource";

const failure = (m: string) => new Error(m);

// La bandeja y quien la llena, sobre las notificaciones de Roble.
//
// En f_market la bandeja vivía en memoria porque el paquete de Dart aún no traía
// notificaciones; `roble-client` sí (`db.notifications`), así que aquí los avisos
// se guardan en el servidor, llegan a otros dispositivos y sobreviven al cierre.
export class NotificationRepositoryImpl implements NotificationRepository, NotificationDispatcher {
  constructor(private readonly source: NotificationDataSource) {}

  async inbox() {
    const items = await guardRoble(() => this.source.list(), failure);
    return items.map(toNotification);
  }

  watch(onNotification: (n: AppNotification) => void) {
    return this.source.watch((n) => onNotification(toNotification(n)));
  }

  markRead(id: string) {
    return guardRoble(() => this.source.markRead(id), failure);
  }

  markAllRead() {
    return guardRoble(() => this.source.markAllRead(), failure);
  }

  // Un aviso que no sale no debe tumbar la acción que lo provocó (la pregunta ya
  // se publicó, el mensaje ya se mandó): se registra y se sigue.
  async dispatch(p: { userIds: string[]; kind: NotificationKind; title: string; body: string; listingId?: string; threadId?: string }) {
    const to = [...new Set(p.userIds)].filter(Boolean);
    if (to.length === 0) return;
    try {
      await this.source.send({
        to,
        title: p.title,
        body: p.body,
        topic: p.kind,
        data: { listingId: p.listingId ?? null, threadId: p.threadId ?? null },
      });
    } catch (e) {
      console.warn("No se pudo enviar el aviso", e);
    }
  }
}

function toNotification(n: RobleNotification): AppNotification {
  const kind = NOTIFICATION_KINDS.includes(n.topic as NotificationKind) ? (n.topic as NotificationKind) : "statusChange";
  return {
    id: n.id,
    kind,
    title: n.title,
    body: n.body ?? "",
    createdAt: parseDate(n.createdAt, new Date()),
    read: n.readAt != null,
    listingId: (n.data?.listingId as string | null) ?? null,
    threadId: (n.data?.threadId as string | null) ?? null,
  };
}
