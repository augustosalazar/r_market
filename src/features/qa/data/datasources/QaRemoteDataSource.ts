import { Row } from "@/src/core/roble/guard";
import { RobleClient } from "@/src/core/roble/RobleClient";
import { QaDataSource } from "./QaDataSource";

// Habla con Roble sobre preguntas públicas. El detalle se ve sin sesión.
export class QaRemoteDataSource implements QaDataSource {
  constructor(private readonly client: RobleClient) {}

  readForListing(listingId: string) {
    return this.client.readPublicOrPrivate(RobleClient.questions, { listing_id: listingId });
  }

  create(row: Row) {
    return this.client.db.create(RobleClient.questions, row);
  }

  update(id: string, changes: Row) {
    return this.client.db.update(RobleClient.questions, id, changes);
  }
}
