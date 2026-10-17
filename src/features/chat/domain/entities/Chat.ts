// Un chat privado entre un comprador y el vendedor, sobre una publicación.
//
// `muted` es lo que el requisito llama «bloquear el chat», visto por quien
// mira: el hilo sigue funcionando, pero deja de avisarle. `otherMuted` es el
// interruptor de la contraparte: si lo tiene puesto, no se le avisa.
export type ChatThread = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingCover: string | null;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  muted: boolean;
  otherMuted: boolean;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  text: string;
  sentAt: Date;
};

// El nombre de la contraparte, visto desde `userId`.
export const otherName = (t: ChatThread, userId: string) => (userId === t.sellerId ? t.buyerName : t.sellerName);
