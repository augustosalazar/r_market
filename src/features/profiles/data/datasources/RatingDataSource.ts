import { Row } from "@/src/core/roble/guard";

export interface RatingDataSource {
  readRatings(filters: Row): Promise<Row[]>;
  createRating(row: Row): Promise<Row>;
}
