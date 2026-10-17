// El motivo de un aviso. Cada valor es uno de los disparadores del requisito.
export type NotificationKind = "question" | "answer" | "statusChange" | "chatMessage";
export const NOTIFICATION_KINDS: NotificationKind[] = ["question", "answer", "statusChange", "chatMessage"];
export const notificationKindLabel: Record<NotificationKind, string> = {
  question: "Pregunta nueva",
  answer: "Respuesta del vendedor",
  statusChange: "Cambio de estado",
  chatMessage: "Mensaje privado",
};

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: Date;
  read: boolean;
  listingId: string | null;
  threadId: string | null;
};
