import { useCallback, useRef, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { messageOf } from "@/src/core/utils/formatters";
import { useSession } from "@/src/features/auth/presentation/context/SessionContext";
import { ChatThread } from "../../domain/entities/Chat";
import { ChatRepository } from "../../domain/repositories/ChatRepository";

// La lista de chats privados de quien está dentro.
//
// Secuencia: la pantalla llama a `load` cada vez que se enfoca → `load` le pide
// los hilos al repositorio → el resultado se guarda en el estado → la pantalla
// se vuelve a dibujar.
export function useChatsViewModel() {
  const chats = useInject<ChatRepository>(TOKENS.ChatRepo);
  const userId = useSession().user?.userId ?? null;

  // ── Estado que lee la pantalla ────────────────────────────
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Número de turno de la última carga: si cambia la sesión a medias, la
  // respuesta de un turno viejo no vale.
  const loadTicket = useRef(0);

  // ── Acciones que llama la pantalla ────────────────────────

  // Estable (useCallback): la pantalla la llama desde `useFocusEffect`, y una
  // función nueva en cada render la volvería a disparar sin parar. Cambia solo
  // cuando cambia quién está dentro, y entonces la pantalla vuelve a pedir.
  const load = useCallback(async () => {
    const id = ++loadTicket.current;
    try {
      setLoading(true);
      const result = userId ? await chats.threadsOf(userId) : [];
      if (id !== loadTicket.current) return;
      setThreads(result);
      setError(null);
    } catch (e) {
      if (id === loadTicket.current) setError(messageOf(e));
    } finally {
      if (id === loadTicket.current) setLoading(false);
    }
  }, [chats, userId]);

  return { threads: userId ? threads : [], loading, error, load, myId: userId };
}
