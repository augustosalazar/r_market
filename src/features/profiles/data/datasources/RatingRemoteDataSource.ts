import { Row } from "@/src/core/roble/guard";
import { RobleClient } from "@/src/core/roble/RobleClient";
import { RatingDataSource } from "./RatingDataSource";

// La tabla es pública: la reputación se mira antes de crear cuenta.
export class RatingRemoteDataSource implements RatingDataSource {
  constructor(private readonly client: RobleClient) {}

  readRatings(filters: Row) {
    return this.client.readPublicOrPrivate(RobleClient.ratings, filters);
  }

  createRating(row: Row) {
    return this.client.db.create(RobleClient.ratings, row);
  }
}
