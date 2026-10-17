import { Row } from "@/src/core/roble/guard";
import { ChatDataSource } from "@/src/features/chat/data/datasources/ChatDataSource";
import { ChatRepositoryImpl } from "@/src/features/chat/data/repositories/ChatRepositoryImpl";

const threadRow = (o: Row = {}) => ({
  _id: "t1",
  listing_id: "l1",
  listing_title: "Mazda 3 2020",
  buyer_id: "buyer",
  buyer_name: "Beto",
  seller_id: "seller",
  seller_name: "Ana",
  created_at: "2026-10-01T10:00:00Z",
  buyer_muted: false,
  seller_muted: true,
  buyer_unread: 2,
  seller_unread: 5,
  ...o,
});

function fakeSource(viewer: string, overrides: Partial<ChatDataSource> = {}): ChatDataSource & { updates: Row[] } {
  const updates: Row[] = [];
  return {
    updates,
    currentUserId: viewer,
    readThreads: jest.fn().mockResolvedValue([threadRow()]),
    threadById: jest.fn().mockResolvedValue(threadRow()),
    createThread: jest.fn(),
    updateThread: jest.fn(async (_id: string, changes: Row) => {
      updates.push(changes);
      return threadRow(changes);
    }),
    listingById: jest.fn(),
    currentUser: jest.fn(),
    readMessages: jest.fn().mockResolvedValue({
      b: { sender_id: "seller", sender_name: "Ana", text: "segundo", sent_at: "2026-10-01T10:00:00Z" },
      a: { sender_id: "buyer", sender_name: "Beto", text: "primero", sent_at: "2026-10-01T11:00:00Z" },
    }),
    pushMessage: jest.fn().mockResolvedValue("c"),
    watchMessageRecords: jest.fn(() => () => {}),
    ...overrides,
  };
}

describe("ChatRepositoryImpl", () => {
  it("shows each participant their own unread count and mute switch", async () => {
    const asSeller = await new ChatRepositoryImpl(fakeSource("seller")).threadById("t1");
    expect(asSeller).toMatchObject({ unreadCount: 5, muted: true, otherMuted: false });
    const asBuyer = await new ChatRepositoryImpl(fakeSource("buyer")).threadById("t1");
    expect(asBuyer).toMatchObject({ unreadCount: 2, muted: false, otherMuted: true });
  });

  it("orders messages by the server key, not by the phone's clock", async () => {
    const messages = await new ChatRepositoryImpl(fakeSource("buyer")).messagesOf("t1");
    expect(messages.map((m) => m.text)).toEqual(["primero", "segundo"]);
  });

  it("bumps the recipient's unread counter when sending", async () => {
    const source = fakeSource("buyer");
    const sent = await new ChatRepositoryImpl(source).send("t1", "buyer", "hola");
    expect(sent).toMatchObject({ id: "c", senderName: "Beto", text: "hola" });
    expect(source.updates[0]).toMatchObject({ last_message: "hola", seller_unread: 6 });
  });

  it("merges the threads where the user buys and sells", async () => {
    const source = fakeSource("seller", {
      readThreads: jest.fn(async (f: Row) => (f.buyer_id ? [threadRow({ _id: "t2" })] : [threadRow()])),
    });
    expect((await new ChatRepositoryImpl(source).threadsOf("seller")).map((t) => t.id).sort()).toEqual(["t1", "t2"]);
  });
});
