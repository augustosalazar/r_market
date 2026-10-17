import { DummyData, matchesRow } from "@/src/core/data/dummyData";
import { Row } from "@/src/core/roble/guard";
import { RatingDataSource } from "./RatingDataSource";

export class RatingInMemoryDataSource implements RatingDataSource {
  constructor(private readonly data: DummyData) {}

  async readRatings(filters: Row) {
    await this.data.delay(0.7);
    return this.data.ratings.filter((r) => matchesRow(r, filters));
  }

  async createRating(row: Row) {
    await this.data.delay(0.7);
    const stored = { ...row, _id: this.data.nextId("r") };
    this.data.ratings.push(stored);
    return stored;
  }
}
