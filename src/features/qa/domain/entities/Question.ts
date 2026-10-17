// Una pregunta pública sobre una publicación, con la respuesta del vendedor
// dentro: el dueño responde una sola vez y en público; la ida y vuelta va por
// chat privado.
export type Answer = { responderId: string; responderName: string; text: string; createdAt: Date };

export type Question = {
  id: string;
  listingId: string;
  askerId: string;
  askerName: string;
  text: string;
  createdAt: Date;
  answer: Answer | null;
};
