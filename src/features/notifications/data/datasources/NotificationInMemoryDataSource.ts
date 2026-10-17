import { RobleNotification } from "roble-client";

import { DummyData } from "@/src/core/data/dummyData";
import { NotificationDataSource } from "./NotificationDataSource";

// La bandeja en memoria: devuelve las mismas formas que `db.notifications`, así
// que el repositorio es el mismo. Es lo que en f_market era
// `InMemoryNotificationRepository`, pero bajado a datasource.
export class NotificationInMemoryDataSource implements NotificationDataSource {
  private listeners = new Set<{ userId: string; onCreated: (n: RobleNotification) => void }>();

  constructor(private readonly data: DummyData) {}

  private get me() {
    return (this.data.session?.userId as string | undefined) ?? null;
  }

  async list() {
    return this.data.notifications.filter((n) => n.recipientId === this.me) as RobleNotification[];
  }

  watch(onCreated: (n: RobleNotification) => void) {
    const me = this.me;
    if (!me) return () => {};
    const listener = { userId: me, onCreated };
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async markRead(id: string) {
    const n = this.data.notifications.find((x) => x.id === id);
    if (n) n.readAt = new Date().toISOString();
  }

  async markAllRead() {
    for (const n of this.data.notifications) if (n.recipientId === this.me) n.readAt ??= new Date().toISOString();
  }

  async send(p: { to: string[]; title: string; body: string; topic: string; data: Record<string, unknown> }) {
    for (const recipientId of p.to) {
      const n = {
        id: this.data.nextId("n"),
        dbName: "local",
        recipientId,
        senderId: this.me,
        topic: p.topic,
        title: p.title,
        body: p.body,
        data: p.data,
        readAt: null,
        createdAt: new Date().toISOString(),
        expiresAt: null,
      } satisfies RobleNotification;
      this.data.notifications.unshift(n);
      this.listeners.forEach((l) => l.userId === recipientId && l.onCreated(n));
    }
  }
}
