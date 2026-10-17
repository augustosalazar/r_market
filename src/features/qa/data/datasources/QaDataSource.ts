import { Row } from "@/src/core/roble/guard";

export interface QaDataSource {
  readForListing(listingId: string): Promise<Row[]>;
  create(row: Row): Promise<Row>;
  update(id: string, changes: Row): Promise<Row>;
}
