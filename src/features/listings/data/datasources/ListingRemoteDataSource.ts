import { RobleQueryResult } from "roble-client";

import { Row } from "@/src/core/roble/guard";
import { RobleClient } from "@/src/core/roble/RobleClient";
import { ListingDataSource } from "./ListingDataSource";

// Habla con Roble sobre publicaciones y seguimientos. No decide nada.
export class ListingRemoteDataSource implements ListingDataSource {
  constructor(private readonly client: RobleClient) {}

  readListings(filters?: Row) {
    return this.client.readPublicOrPrivate(RobleClient.listings, filters);
  }

  // Con cuenta, el filtro entero se resuelve en Postgres con la consulta
  // guardada. Sin cuenta —o como invitado— ejecutar consultas no está permitido:
  // va por `publicRead`, que al menos filtra la marca en el servidor.
  async searchListings(p: { text: string; brand: string | null; minPrice: number | null; maxPrice: number | null; minYear: number | null }) {
    if (this.client.readsPublicly) {
      return this.client.db.publicRead(RobleClient.listings, p.brand == null ? undefined : { brand: p.brand });
    }
    const result = await this.client.db.executeQueryByName(RobleClient.searchListingsQuery, [
      // El orden es el de `$1..$5` en el SQL guardado.
      p.text,
      p.brand,
      p.minPrice,
      p.maxPrice,
      p.minYear,
    ]);
    return rowsOf(result);
  }

  async listingById(id: string) {
    if (!this.client.readsPublicly) return this.client.db.getById(RobleClient.listings, id);
    // Sin sesión no hay `getById`, pero `publicRead` filtra por `_id`.
    const rows = await this.client.db.publicRead(RobleClient.listings, { _id: id });
    return rows[0] ?? null;
  }

  async listingsByIds(ids: string[]) {
    if (ids.length === 0) return [];
    if (this.client.readsPublicly) {
      const rows = await Promise.all(ids.map((id) => this.listingById(id)));
      return rows.filter((r): r is Row => r != null);
    }
    return rowsOf(await this.client.db.executeQueryByName(RobleClient.listingsByIdsQuery, [ids]));
  }

  createListing(row: Row) {
    return this.client.db.create(RobleClient.listings, row);
  }

  updateListing(id: string, changes: Row) {
    return this.client.db.update(RobleClient.listings, id, changes);
  }

  // Seguir es de quien tiene sesión: `listing_follow` no es pública.
  readFollows(filters: Row) {
    return this.client.db.read(RobleClient.follows, filters);
  }

  createFollow(row: Row) {
    return this.client.db.create(RobleClient.follows, row);
  }

  async deleteFollow(id: string) {
    await this.client.db.delete(RobleClient.follows, id);
  }
}

function rowsOf(result: RobleQueryResult): Row[] {
  return result.rows.filter((r): r is Row => r != null && typeof r === "object");
}
