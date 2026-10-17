import { Row } from "@/src/core/roble/guard";

// Habla en filas —lo que viaja por la API—, no en entidades: así el repositorio
// se prueba con una fuente falsa que devuelve las mismas filas.
export interface ListingDataSource {
  readListings(filters?: Row): Promise<Row[]>;
  // Las publicaciones que **pueden** cumplir el filtro: al menos todas las que
  // lo cumplen, y quizá más. El repositorio vuelve a filtrar.
  searchListings(params: {
    text: string;
    brand: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    minYear: number | null;
  }): Promise<Row[]>;
  listingById(id: string): Promise<Row | null>;
  listingsByIds(ids: string[]): Promise<Row[]>;
  createListing(row: Row): Promise<Row>;
  updateListing(id: string, changes: Row): Promise<Row>;
  readFollows(filters: Row): Promise<Row[]>;
  createFollow(row: Row): Promise<Row>;
  deleteFollow(id: string): Promise<void>;
}
