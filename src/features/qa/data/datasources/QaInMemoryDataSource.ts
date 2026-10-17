import { DummyData } from "@/src/core/data/dummyData";
import { Row } from "@/src/core/roble/guard";
import { QaDataSource } from "./QaDataSource";

export class QaInMemoryDataSource implements QaDataSource {
  constructor(private readonly data: DummyData) {}

  async readForListing(listingId: string) {
    await this.data.delay();
    return this.data.questions.filter((r) => r.listing_id === listingId);
  }

  async create(row: Row) {
    await this.data.delay();
    const stored = { ...row, _id: this.data.nextId("q") };
    this.data.questions.push(stored);
    return stored;
  }

  async update(id: string, changes: Row) {
    await this.data.delay();
    const index = this.data.questions.findIndex((r) => r._id === id);
    if (index < 0) throw new Error(`No existe la pregunta ${id}`);
    this.data.questions[index] = { ...this.data.questions[index], ...changes };
    return this.data.questions[index];
  }
}
