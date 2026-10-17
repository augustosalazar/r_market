import { useCallback, useEffect, useRef, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { messageOf } from "@/src/core/utils/formatters";
import { useSession } from "@/src/features/auth/presentation/context/SessionContext";
import { NotificationDispatcher } from "@/src/features/notifications/domain/repositories/NotificationRepository";
import { ChatMessage, ChatThread } from "../../domain/entities/Chat";
import { ChatRepository } from "../../domain/repositories/ChatRepository";

// Un chat abierto. La regla propia está en `send`: el destinatario recibe aviso
// salvo que haya silenciado el hilo (el «bloqueo» del requisito 8).
export function useChatViewModel(threadId: string) {
  const chats = useInject<ChatRepository>(TOKENS.ChatRepo);
  const dispatcher = useInject<NotificationDispatcher>(TOKENS.NotificationDispatcher);
  const session = useSession();
  const snackbar = useSnackbar();
  const myId = session.user?.userId ?? "";

  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  // Pinta un mensaje una sola vez: el mismo llega por el eco del socket y por la
  // respuesta de `send`, con la misma clave del servidor.
  const append = useCallback((m: ChatMessage) => {
    setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
  }, []);

  // Se lee primero y se escucha después: el tiempo real no reenvía lo que ya estaba.
  const listen = useCallback(() => {
    stopRef.current?.();
    stopRef.current = chats.watchMessages(
      threadId,
      (incoming) => {
        append(incoming);
        if (incoming.senderId !== myId) chats.markRead(threadId).catch(() => {});
      },
      // Un hilo sin mensajes aún no tiene colección en el árbol, y suscribirse a
      // una que no existe se rechaza. Se deja de escuchar y se reintenta al enviar.
      () => {
        stopRef.current?.();
        stopRef.current = null;
      },
    );
  }, [append, chats, myId, threadId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await chats.markRead(threadId);
        const t = await chats.threadById(threadId);
        const loaded = await chats.messagesOf(threadId);
        if (!active) return;
        setThread(t);
        setMessages(loaded);
        listen();
      } catch (e) {
        if (active) snackbar(messageOf(e), { error: true });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [chats, listen, snackbar, threadId]);

  const send = async (text: string) => {
    const body = text.trim();
    if (!thread || !body) return;
    setSending(true);
    try {
      append(await chats.send(thread.id, myId, body));
      // Si la escucha no estaba (hilo nuevo), ahora la colección ya existe.
      if (!stopRef.current) listen();
      // Se avisa salvo que quien recibe haya silenciado el hilo.
      if (!thread.otherMuted) {
        const recipient = myId === thread.sellerId ? thread.buyerId : thread.sellerId;
        await dispatcher.dispatch({
          userIds: [recipient],
          kind: "chatMessage",
          title: session.user?.name ?? "Mensaje",
          body,
          listingId: thread.listingId,
          threadId: thread.id,
        });
      }
    } catch {
      snackbar("No se pudo enviar el mensaje.", { error: true });
    } finally {
      setSending(false);
    }
  };

  const toggleMuted = async () => {
    if (!thread) return;
    try {
      const updated = await chats.setMuted(thread.id, !thread.muted);
      setThread(updated);
      snackbar(
        updated.muted
          ? "Chat silenciado: no recibirás avisos de este chat."
          : "Chat activo: volverás a recibir avisos de este chat.",
      );
    } catch (e) {
      snackbar(messageOf(e), { error: true });
    }
  };

  return { thread, messages, loading, sending, myId, send, toggleMuted };
}
