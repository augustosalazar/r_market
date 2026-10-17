import { guardRoble, parseDate, Row, toNumber } from "@/src/core/roble/guard";
import { ChatFailure } from "../../domain/ChatFailure";
import { ChatMessage, ChatThread } from "../../domain/entities/Chat";
import { ChatRepository } from "../../domain/repositories/ChatRepository";
import { ChatDataSource } from "../datasources/ChatDataSource";

const failure = (m: string) => new ChatFailure(m);
const latestFirst = (a: ChatThread, b: ChatThread) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime();

// El chat privado: decide y traduce, no habla.
export class ChatRepositoryImpl implements ChatRepository {
  constructor(private readonly source: ChatDataSource) {}

  async threadsOf(userId: string) {
    // `read` filtra por igualdad con Y: «comprador O vendedor» son dos lecturas.
    const [asBuyer, asSeller] = await Promise.all([
      guardRoble(() => this.source.readThreads({ buyer_id: userId }), failure),
      guardRoble(() => this.source.readThreads({ seller_id: userId }), failure),
    ]);
    const byId = new Map<string, ChatThread>();
    for (const row of [...asBuyer, ...asSeller]) {
      const t = this.toThread(row);
      byId.set(t.id, t);
    }
    return [...byId.values()].sort(latestFirst);
  }

  async threadById(threadId: string) {
    const row = await guardRoble(() => this.source.threadById(threadId), failure);
    return row ? this.toThread(row) : null;
  }

  async threadsOfListing(listingId: string) {
    const rows = await guardRoble(() => this.source.readThreads({ listing_id: listingId }), failure);
    return rows.map((r) => this.toThread(r)).sort(latestFirst);
  }

  async openThread(listingId: string, buyerId: string) {
    const existing = await guardRoble(
      () => this.source.readThreads({ listing_id: listingId, buyer_id: buyerId }),
      failure,
    );
    if (existing.length > 0) return this.toThread(existing[0]);

    const listing = await guardRoble(() => this.source.listingById(listingId), failure);
    if (!listing) throw new ChatFailure("Esa publicación ya no existe.");
    // Quien abre el chat es siempre el comprador, o sea la sesión actual.
    const buyer = await guardRoble(() => this.source.currentUser(), failure);
    const cover = ["image_1", "image_2", "image_3"].map((c) => listing[c]).find((v) => typeof v === "string" && v);

    const row = await guardRoble(
      () =>
        this.source.createThread({
          listing_id: listingId,
          listing_title: `${listing.brand} ${listing.model} ${listing.year}`,
          listing_cover: cover ?? null,
          buyer_id: buyerId,
          buyer_name: buyer.name,
          seller_id: listing.seller_id,
          seller_name: listing.seller_name,
          created_at: new Date().toISOString(),
          buyer_muted: false,
          seller_muted: false,
          buyer_unread: 0,
          seller_unread: 0,
        }),
      failure,
    );
    return this.toThread(row);
  }

  async messagesOf(threadId: string) {
    const data = await guardRoble(() => this.source.readMessages(threadId), failure);
    if (data == null || typeof data !== "object") return [];
    return (
      Object.entries(data as Row)
        .map(([key, value]) => toMessage(threadId, key, value))
        .filter((m): m is ChatMessage => m != null)
        // Por clave, no por fecha: la del servidor es monótona y la del teléfono
        // que envió puede ir adelantada o atrasada.
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    );
  }

  watchMessages(threadId: string, onMessage: (m: ChatMessage) => void, onError: (e: unknown) => void) {
    return this.source.watchMessageRecords(
      threadId,
      (record) => {
        for (const [key, value] of Object.entries(record)) {
          const m = toMessage(threadId, key, value);
          if (m) onMessage(m);
        }
      },
      onError,
    );
  }

  async send(threadId: string, senderId: string, text: string) {
    const row = await guardRoble(() => this.source.threadById(threadId), failure);
    if (!row) throw new ChatFailure("Ese chat ya no existe.");

    const sentAt = new Date();
    const senderIsSeller = senderId === row.seller_id;
    const senderName = String(senderIsSeller ? row.seller_name : row.buyer_name);

    const key = await guardRoble(
      () =>
        this.source.pushMessage(threadId, {
          sender_id: senderId,
          sender_name: senderName,
          text,
          sent_at: sentAt.toISOString(),
        }),
      failure,
    );

    // La cabecera guarda el último mensaje para pintar la lista sin abrir cada
    // hilo, y sube el contador del que recibe.
    const unreadField = senderIsSeller ? "buyer_unread" : "seller_unread";
    await guardRoble(
      () =>
        this.source.updateThread(threadId, {
          last_message: text,
          last_message_at: sentAt.toISOString(),
          [unreadField]: toNumber(row[unreadField]) + 1,
        }),
      failure,
    );

    return { id: key, threadId, senderId, senderName, text, sentAt };
  }

  async setMuted(threadId: string, muted: boolean) {
    const thread = await this.threadById(threadId);
    if (!thread) throw new ChatFailure("Ese chat ya no existe.");
    // Silenciar es de quien mira: cada participante tiene su interruptor.
    const field = this.source.currentUserId === thread.sellerId ? "seller_muted" : "buyer_muted";
    const row = await guardRoble(() => this.source.updateThread(threadId, { [field]: muted }), failure);
    return this.toThread(row);
  }

  async markRead(threadId: string) {
    const thread = await this.threadById(threadId);
    if (!thread || thread.unreadCount === 0) return;
    const field = this.source.currentUserId === thread.sellerId ? "seller_unread" : "buyer_unread";
    await guardRoble(() => this.source.updateThread(threadId, { [field]: 0 }), failure);
  }

  private toThread(row: Row): ChatThread {
    const createdAt = parseDate(row.created_at);
    const viewerIsSeller = this.source.currentUserId === row.seller_id;
    return {
      id: String(row._id),
      listingId: String(row.listing_id),
      listingTitle: (row.listing_title as string) || "Publicación",
      listingCover: (row.listing_cover as string) || null,
      buyerId: String(row.buyer_id),
      buyerName: (row.buyer_name as string) || "Comprador",
      sellerId: String(row.seller_id),
      sellerName: (row.seller_name as string) || "Vendedor",
      lastMessage: (row.last_message as string) ?? "",
      lastMessageAt: parseDate(row.last_message_at, createdAt),
      // Lo que ve quien mira: el contador del otro no es asunto suyo.
      unreadCount: toNumber(viewerIsSeller ? row.seller_unread : row.buyer_unread),
      muted: (viewerIsSeller ? row.seller_muted : row.buyer_muted) === true,
      otherMuted: (viewerIsSeller ? row.buyer_muted : row.seller_muted) === true,
    };
  }
}

function toMessage(threadId: string, key: string, data: unknown): ChatMessage | null {
  if (data == null || typeof data !== "object") return null;
  const d = data as Row;
  return {
    id: key,
    threadId,
    senderId: String(d.sender_id),
    senderName: String(d.sender_name ?? ""),
    text: String(d.text ?? ""),
    sentAt: parseDate(d.sent_at, new Date()),
  };
}
