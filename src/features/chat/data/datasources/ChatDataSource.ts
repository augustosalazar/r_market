import { Row } from "@/src/core/roble/guard";

// Los mensajes van aparte de la cabecera porque en Roble viven en otro sitio:
// el árbol JSON, que es lo único que emite tiempo real.
export interface ChatDataSource {
  // Quién mira, para decidir cuál de los dos interruptores del hilo es suyo.
  readonly currentUserId: string | null;
  readThreads(filters: Row): Promise<Row[]>;
  threadById(id: string): Promise<Row | null>;
  createThread(row: Row): Promise<Row>;
  updateThread(id: string, changes: Row): Promise<Row>;
  listingById(id: string): Promise<Row | null>;
  currentUser(): Promise<Row>;
  // Todo el hilo: `{clave: mensaje}`, o `null` si aún no tiene ninguno.
  readMessages(threadId: string): Promise<unknown>;
  // Devuelve la clave, que el servidor genera ordenada por tiempo.
  pushMessage(threadId: string, message: Row): Promise<string>;
  // Lo que llegue, ya desenvuelto: `{clave: mensaje}`.
  watchMessageRecords(threadId: string, onRecord: (record: Row) => void, onError: (e: unknown) => void): () => void;
}
