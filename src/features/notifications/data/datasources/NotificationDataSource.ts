import { RobleNotification } from "roble-client";

export interface NotificationDataSource {
  list(): Promise<RobleNotification[]>;
  watch(onCreated: (n: RobleNotification) => void): () => void;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
  send(params: { to: string[]; title: string; body: string; topic: string; data: Record<string, unknown> }): Promise<void>;
}
