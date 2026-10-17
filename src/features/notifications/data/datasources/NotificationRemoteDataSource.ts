import { RobleClient } from "@/src/core/roble/RobleClient";
import { NotificationDataSource } from "./NotificationDataSource";

// Habla con `db.notifications`: avisos que se guardan en el servidor y llegan
// al momento por su propio socket.
export class NotificationRemoteDataSource implements NotificationDataSource {
  constructor(private readonly client: RobleClient) {}

  list() {
    return this.client.db.notifications.list();
  }

  watch(onCreated: Parameters<NotificationDataSource["watch"]>[0]) {
    return this.client.db.notifications.watch(
      ({ type, notification }) => {
        if (type === "created") onCreated(notification);
      },
      // Sin sesión el socket no abre; no es algo que la pantalla deba enseñar.
      { onError: () => {} },
    );
  }

  async markRead(id: string) {
    await this.client.db.notifications.markRead(id);
  }

  async markAllRead() {
    await this.client.db.notifications.markAllRead();
  }

  async send(params: { to: string[]; title: string; body: string; topic: string; data: Record<string, unknown> }) {
    await this.client.db.notifications.send(params);
  }
}
