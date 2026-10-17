import { DummyData, matchesRow } from "@/src/core/data/dummyData";
import { Row } from "@/src/core/roble/guard";
import { ListingDataSource } from "./ListingDataSource";

// Las mismas filas, servidas desde memoria. Simula la latencia para que los
// estados de carga se vean, y el `_id` lo pone la fuente, como el servidor.
export class ListingInMemoryDataSource implements ListingDataSource {
  constructor(private readonly data: DummyData) {}

  async readListings(filters?: Row) {
    await this.data.delay();
    return this.data.listings.filter((r) => matchesRow(r, filters));
  }

  // Solo la marca: el resto lo filtra el repositorio, y repetirlo aquí sería
  // probar una copia de la regla en vez de la regla.
  searchListings(p: { brand: string | null }) {
    return this.readListings(p.brand == null ? undefined : { brand: p.brand });
  }

  async listingById(id: string) {
    await this.data.delay();
    return this.data.listings.find((r) => r._id === id) ?? null;
  }

  async listingsByIds(ids: string[]) {
    await this.data.delay();
    return this.data.listings.filter((r) => ids.includes(r._id));
  }

  async createListing(row: Row) {
    await this.data.delay();
    const stored = { ...row, _id: this.data.nextId("l") };
    this.data.listings.unshift(stored);
    return stored;
  }

  async updateListing(id: string, changes: Row) {
    await this.data.delay();
    const index = this.data.listings.findIndex((r) => r._id === id);
    if (index < 0) throw new Error(`No existe la publicación ${id}`);
    this.data.listings[index] = { ...this.data.listings[index], ...changes };
    return this.data.listings[index];
  }

  async readFollows(filters: Row) {
    await this.data.delay();
    return this.data.follows.filter((r) => matchesRow(r, filters));
  }

  async createFollow(row: Row) {
    const stored = { ...row, _id: this.data.nextId("f") };
    this.data.follows.push(stored);
    return stored;
  }

  async deleteFollow(id: string) {
    this.data.follows = this.data.follows.filter((r) => r._id !== id);
  }
}
