// Los filtros del catálogo. Viajan al repositorio para resolverse en el servidor.
export type ListingFilter = {
  query: string;
  brand: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  minYear: number | null;
};

export const emptyFilter: ListingFilter = { query: "", brand: null, minPrice: null, maxPrice: null, minYear: null };

export const isFilterEmpty = (f: ListingFilter) =>
  f.query === "" && f.brand == null && f.minPrice == null && f.maxPrice == null && f.minYear == null;

// La regla del filtro, en un solo sitio: el repositorio la vuelve a aplicar sobre
// lo que devuelva la fuente, que sin cuenta trae de más.
export function matchesFilter(
  l: { brand: string; model: string; year: number; city: string; price: number },
  f: ListingFilter,
): boolean {
  const query = f.query.trim().toLowerCase();
  if (query && !`${l.brand} ${l.model} ${l.year} ${l.city}`.toLowerCase().includes(query)) return false;
  if (f.brand != null && l.brand !== f.brand) return false;
  if (f.minPrice != null && l.price < f.minPrice) return false;
  if (f.maxPrice != null && l.price > f.maxPrice) return false;
  if (f.minYear != null && l.year < f.minYear) return false;
  return true;
}
