import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { useAsyncData } from "@/src/core/utils/useAsyncData";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { messageOf } from "@/src/core/utils/formatters";
import { useSession } from "@/src/features/auth/presentation/context/SessionContext";
import { ChatRepository } from "@/src/features/chat/domain/repositories/ChatRepository";
import { NotificationDispatcher } from "@/src/features/notifications/domain/repositories/NotificationRepository";
import { Question } from "@/src/features/qa/domain/entities/Question";
import { QaRepository } from "@/src/features/qa/domain/repositories/QaRepository";
import { CarListing, ListingStatus, statusLabel } from "../../domain/entities/CarListing";
import { ListingRepository } from "../../domain/repositories/ListingRepository";
import { useFollows } from "../context/FollowsContext";
import { notifyListing, notifyStatusChange } from "../listingNotices";

// El detalle: ficha, preguntas públicas, seguir y chat privado. Aquí viven las
// reglas de quién puede preguntar, quién responde y a quién se le avisa.
export function useListingDetailViewModel(listingId: string) {
  const listings = useInject<ListingRepository>(TOKENS.ListingRepo);
  const qa = useInject<QaRepository>(TOKENS.QaRepo);
  const chats = useInject<ChatRepository>(TOKENS.ChatRepo);
  const dispatcher = useInject<NotificationDispatcher>(TOKENS.NotificationDispatcher);
  const session = useSession();
  const follows = useFollows();
  const snackbar = useSnackbar();
  const navigation = useNavigation();

  const [sending, setSending] = useState(false);

  const fetchListing = useCallback(() => listings.byId(listingId), [listingId, listings]);
  const fetchQuestions = useCallback(() => qa.forListing(listingId), [listingId, qa]);
  const listingData = useAsyncData<CarListing | null>(fetchListing, null);
  const questionData = useAsyncData<Question[]>(fetchQuestions, []);
  const listing = listingData.data;
  const setListing = listingData.setData;
  const setQuestions = questionData.setData;
  const loading = listingData.loading;

  const loadError = listingData.error ?? questionData.error;
  useEffect(() => {
    if (loadError) snackbar(loadError, { error: true });
  }, [loadError, snackbar]);

  const isOwner = session.user != null && listing?.sellerId === session.user.userId;

  // Corre una acción con el indicador puesto y su error en la barra.
  const guard = async (action: () => Promise<void>) => {
    setSending(true);
    try {
      await action();
    } catch (e) {
      snackbar(messageOf(e), { error: true });
    } finally {
      setSending(false);
    }
  };

  const toggleFollow = async () => {
    const following = await follows.toggle(listingId);
    if (following == null) return;
    snackbar(
      following
        ? "Sigues esta publicación: te avisaremos de preguntas, respuestas y cambios de estado."
        : "Dejaste de seguir esta publicación.",
    );
  };

  // Pregunta pública. No exige cuenta: basta una sesión de invitado. Avisa al
  // vendedor y a los seguidores, nunca a quien pregunta. Devuelve si se publicó.
  // La pantalla ya se aseguró de la sesión y del nombre con el que firmar;
  // `signature` llega cuando el nombre se acaba de elegir y aún no está en el estado.
  const ask = async (text: string, signature?: string): Promise<boolean> => {
    const asker = session.currentUser();
    const body = text.trim();
    if (!listing || !asker) return false;
    if (!body) {
      snackbar("Escribe tu pregunta.", { error: true });
      return false;
    }
    if (asker.userId === listing.sellerId) {
      snackbar("No puedes preguntar en tu propia publicación.", { error: true });
      return false;
    }
    // El nombre que se copia en la fila es el elegido, no «Invitado».
    const signedAs = signature ?? (session.displayName || asker.name);
    let ok = false;
    await guard(async () => {
      await qa.ask({ listingId: listing.id, askerId: asker.userId, askerName: signedAs, text: body });
      await notifyListing(
        { listings, dispatcher },
        { listing, kind: "question", body: `${signedAs} preguntó: ${body}`, exclude: [asker.userId], includeSeller: true },
      );
      setQuestions(await qa.forListing(listingId));
      snackbar("Pregunta publicada.");
      ok = true;
    });
    return ok;
  };

  // Respuesta pública del dueño. Avisa a quien preguntó y a los seguidores.
  const answer = async (question: Question, text: string): Promise<boolean> => {
    const body = text.trim();
    const responder = session.user;
    if (!listing) return false;
    if (!body) {
      snackbar("Escribe la respuesta.", { error: true });
      return false;
    }
    if (!responder || responder.userId !== listing.sellerId) {
      snackbar("Solo el dueño de la publicación puede responder.", { error: true });
      return false;
    }
    let ok = false;
    await guard(async () => {
      await qa.answer({ questionId: question.id, responderId: responder.userId, responderName: responder.name, text: body });
      await notifyListing(
        { listings, dispatcher },
        {
          listing,
          kind: "answer",
          body: `${responder.name} respondió: ${body}`,
          exclude: [responder.userId],
          includeSeller: false,
          extra: [question.askerId],
        },
      );
      setQuestions(await qa.forListing(listingId));
      snackbar("Respuesta publicada.");
      ok = true;
    });
    return ok;
  };

  const changeStatus = (status: ListingStatus) =>
    guard(async () => {
      if (!listing) return;
      const updated = await listings.changeStatus(listing.id, status);
      setListing(updated);
      await notifyStatusChange({ listings, dispatcher }, updated, status);
      snackbar(`Estado actualizado a ${statusLabel[status].toLowerCase()}.`);
    });

  // Cierra la venta con comprador: alimenta el historial y habilita calificar.
  const markSold = (buyerId: string, buyerName: string) =>
    guard(async () => {
      if (!listing) return;
      const updated = await listings.markSold(listing.id, buyerId, buyerName);
      setListing(updated);
      await notifyStatusChange({ listings, dispatcher }, updated, "sold");
      snackbar(`Venta registrada con ${buyerName}.`);
    });

  const buyerCandidates = useCallback(
    async (l: CarListing) => (await chats.threadsOfListing(l.id)).filter((t) => t.buyerId !== l.sellerId),
    [chats],
  );

  // Abre (o reabre) el chat privado con el vendedor. Exige cuenta.
  const openPrivateChat = () =>
    guard(async () => {
      if (!session.ensureLoggedIn()) return;
      const me = session.currentUser();
      if (!me) return;
      const thread = await chats.openThread(listingId, me.userId);
      navigation.navigate("Chat", { threadId: thread.id });
    });

  return {
    listing,
    questions: questionData.data,
    loading,
    sending,
    isOwner,
    isFollowing: follows.isFollowing(listingId),
    refresh: () => {
      listingData.reload();
      questionData.reload();
    },
    toggleFollow,
    ask,
    answer,
    changeStatus,
    markSold,
    buyerCandidates,
    openPrivateChat,
  };
}
