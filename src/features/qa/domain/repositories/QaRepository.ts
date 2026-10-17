import { Question } from "../entities/Question";

// Preguntas públicas sobre una publicación.
export interface QaRepository {
  forListing(listingId: string): Promise<Question[]>;
  ask(params: { listingId: string; askerId: string; askerName: string; text: string }): Promise<Question>;
  answer(params: { questionId: string; responderId: string; responderName: string; text: string }): Promise<Question>;
}
