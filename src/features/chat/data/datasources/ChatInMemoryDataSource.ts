import { DummyData, matchesRow } from "@/src/core/data/dummyData";
import { Row } from "@/src/core/roble/guard";
import { ChatDataSource } from "./ChatDataSource";

// Los chats en memoria. Sin servidor no hay tiempo real, pero la pantalla
// escucha igual: la escucha reproduce lo que escribe este mismo dispositivo.
export class ChatInMemoryDataSource implements ChatDataSource {
  private listeners = new Set<{ threadId: string; onRecord: (r: Row) => void }>();
  private messageCounter = 100;

  constructor(private readonly data: DummyData) {}

  get currentUserId() {
    return (this.data.session?.userId as string | undefined) ?? null;
  }

  async readThreads(filters: Row) {
    await this.data.delay(0.7);
    return this.data.threads.filter((r) => matchesRow(r, filters));
  }

  async threadById(id: string) {
    return this.data.threads.find((r) => r._id === id) ?? null;
  }

  async createThread(row: Row) {
    await this.data.delay(0.7);
    const stored = { ...row, _id: this.data.nextId("t") };
    this.data.threads.push(stored);
    return stored;
  }

  async updateThread(id: string, changes: Row) {
    const index = this.data.threads.findIndex((r) => r._id === id);
    if (index < 0) throw new Error(`No existe el chat ${id}`);
    this.data.threads[index] = { ...this.data.threads[index], ...changes };
    return this.data.threads[index];
  }

  async listingById(id: string) {
    return this.data.listings.find((r) => r._id === id) ?? null;
  }

  async currentUser() {
    if (!this.data.session) throw new Error("No hay sesión");
    return this.data.session;
  }

  async readMessages(threadId: string) {
    await this.data.delay(0.7);
    return this.data.messages[threadId] ?? null;
  }

  async pushMessage(threadId: string, message: Row) {
    // Claves ordenadas, como las del servidor.
    this.messageCounter += 1;
    const key = `m_${this.messageCounter}`;
    (this.data.messages[threadId] ??= {})[key] = message;
    this.listeners.forEach((l) => l.threadId === threadId && l.onRecord({ [key]: message }));
    return key;
  }

  watchMessageRecords(threadId: string, onRecord: (record: Row) => void) {
    const listener = { threadId, onRecord };
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
