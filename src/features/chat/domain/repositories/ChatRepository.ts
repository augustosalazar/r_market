import { ChatMessage, ChatThread } from "../entities/Chat";

// Chats privados entre comprador y vendedor.
export interface ChatRepository {
  threadsOf(userId: string): Promise<ChatThread[]>;
  threadById(threadId: string): Promise<ChatThread | null>;
  // Los chats sobre una publicación: los candidatos a comprador al venderla.
  threadsOfListing(listingId: string): Promise<ChatThread[]>;
  // El chat de esa publicación con ese comprador, creándolo si no existe.
  openThread(listingId: string, buyerId: string): Promise<ChatThread>;
  messagesOf(threadId: string): Promise<ChatMessage[]>;
  // Lo que llegue de ahora en adelante. Devuelve la función para cancelar.
  watchMessages(threadId: string, onMessage: (m: ChatMessage) => void, onError: (e: unknown) => void): () => void;
  send(threadId: string, senderId: string, text: string): Promise<ChatMessage>;
  setMuted(threadId: string, muted: boolean): Promise<ChatThread>;
  markRead(threadId: string): Promise<void>;
}
