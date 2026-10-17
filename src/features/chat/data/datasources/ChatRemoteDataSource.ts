import { Row } from "@/src/core/roble/guard";
import { RobleClient } from "@/src/core/roble/RobleClient";
import { ChatDataSource } from "./ChatDataSource";

// La cabecera del hilo es una tabla SQL; los mensajes, el árbol JSON:
// `chat_message/<threadId>/<clave>`. El tiempo real solo emite del árbol.
export class ChatRemoteDataSource implements ChatDataSource {
  constructor(private readonly client: RobleClient) {}

  private pathOf(threadId: string) {
    return `${RobleClient.messages}/${threadId}`;
  }

  get currentUserId() {
    return this.client.currentUserId;
  }

  readThreads(filters: Row) {
    return this.client.db.read(RobleClient.threads, filters);
  }

  threadById(id: string) {
    return this.client.db.getById(RobleClient.threads, id);
  }

  createThread(row: Row) {
    return this.client.db.create(RobleClient.threads, row);
  }

  updateThread(id: string, changes: Row) {
    return this.client.db.update(RobleClient.threads, id, changes);
  }

  listingById(id: string) {
    return this.client.db.getById(RobleClient.listings, id);
  }

  currentUser() {
    return this.client.db.currentUser();
  }

  readMessages(threadId: string) {
    return this.client.db.json.read(this.pathOf(threadId));
  }

  pushMessage(threadId: string, message: Row) {
    return this.client.db.json.push(this.pathOf(threadId), message);
  }

  watchMessageRecords(threadId: string, onRecord: (record: Row) => void, onError: (e: unknown) => void) {
    return this.client.db.json.watch(
      this.pathOf(threadId),
      // En un push, `newValue` trae `{claveNueva: dato}`.
      (event) => onRecord((event.newValue as Row | null) ?? {}),
      { onError },
    );
  }
}
