import { guardRoble, parseDate, Row } from "@/src/core/roble/guard";
import { Question } from "../../domain/entities/Question";
import { QaFailure } from "../../domain/QaFailure";
import { QaRepository } from "../../domain/repositories/QaRepository";
import { QaDataSource } from "../datasources/QaDataSource";

const failure = (m: string) => new QaFailure(m);

export class QaRepositoryImpl implements QaRepository {
  constructor(private readonly source: QaDataSource) {}

  async forListing(listingId: string) {
    const rows = await guardRoble(() => this.source.readForListing(listingId), failure);
    return rows.map(toQuestion).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async ask(p: { listingId: string; askerId: string; askerName: string; text: string }) {
    const row = await guardRoble(
      () =>
        this.source.create({
          listing_id: p.listingId,
          asker_id: p.askerId,
          asker_name: p.askerName,
          body: p.text,
          created_at: new Date().toISOString(),
        }),
      failure,
    );
    return toQuestion(row);
  }

  async answer(p: { questionId: string; responderId: string; responderName: string; text: string }) {
    const row = await guardRoble(
      () =>
        this.source.update(p.questionId, {
          answer_body: p.text,
          answer_by: p.responderId,
          answer_by_name: p.responderName,
          answered_at: new Date().toISOString(),
        }),
      failure,
      { notFound: "Esa pregunta ya no existe." },
    );
    return toQuestion(row);
  }
}

function toQuestion(row: Row): Question {
  const createdAt = parseDate(row.created_at);
  return {
    id: String(row._id),
    listingId: String(row.listing_id),
    askerId: String(row.asker_id),
    askerName: (row.asker_name as string) || "Sin nombre",
    text: String(row.body ?? ""),
    createdAt,
    answer:
      row.answer_body == null
        ? null
        : {
            responderId: (row.answer_by as string) ?? "",
            responderName: (row.answer_by_name as string) || "El vendedor",
            text: String(row.answer_body),
            createdAt: parseDate(row.answered_at, createdAt),
          },
  };
}
