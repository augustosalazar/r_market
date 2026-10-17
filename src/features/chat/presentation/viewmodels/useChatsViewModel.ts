import { useCallback } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { useAsyncData } from "@/src/core/utils/useAsyncData";
import { useSession } from "@/src/features/auth/presentation/context/SessionContext";
import { ChatThread } from "../../domain/entities/Chat";
import { ChatRepository } from "../../domain/repositories/ChatRepository";

// La lista de chats privados de quien está dentro.
export function useChatsViewModel() {
  const chats = useInject<ChatRepository>(TOKENS.ChatRepo);
  const userId = useSession().user?.userId ?? null;
  const fetchThreads = useCallback(async () => (userId ? chats.threadsOf(userId) : []), [chats, userId]);
  const { data, loading, error, reload } = useAsyncData<ChatThread[]>(fetchThreads, []);

  return { threads: userId ? data : [], loading, error, load: reload, myId: userId };
}
