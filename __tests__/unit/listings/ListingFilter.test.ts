import { emptyFilter, isFilterEmpty, ListingFilter } from "@/src/features/listings/domain/entities/ListingFilter";

// Dominio puro: entra un valor, sale otro. No hace falta nada falso.
//
// Diferencia con f_market: allí `ListingFilter` era una clase con `copyWith` y
// banderas `clearBrand`, porque en Dart pasar `brand: null` se lee como «no la
// toques». En TypeScript el filtro es un objeto plano y se copia con `...`:
// escribir `brand: null` sí la quita, así que esas banderas sobran.
describe("ListingFilter", () => {
  it("un filtro nuevo está vacío", () => {
    expect(isFilterEmpty(emptyFilter)).toBe(true);
  });

  it("con texto de búsqueda ya no está vacío", () => {
    const filter: ListingFilter = { ...emptyFilter, query: "mazda" };

    expect(isFilterEmpty(filter)).toBe(false);
  });

  it("copiar con `...` cambia solo lo que se le pasa", () => {
    const filter: ListingFilter = { ...emptyFilter, query: "mazda", minYear: 2020 };

    const updated = { ...filter, brand: "Kia" };

    expect(updated.brand).toBe("Kia");
    expect(updated.query).toBe("mazda");
    expect(updated.minYear).toBe(2020);
  });

  it("poner la marca en null la quita", () => {
    const filter: ListingFilter = { ...emptyFilter, brand: "Kia" };

    const updated = { ...filter, brand: null };

    expect(updated.brand).toBeNull();
    expect(isFilterEmpty(updated)).toBe(true);
  });
});
