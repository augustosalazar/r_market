import { RobleApiNotFoundException } from "roble-client";

import { Row } from "@/src/core/roble/guard";
import { ListingDataSource } from "@/src/features/listings/data/datasources/ListingDataSource";
import { ListingRepositoryImpl } from "@/src/features/listings/data/repositories/ListingRepositoryImpl";
import { emptyFilter } from "@/src/features/listings/domain/entities/ListingFilter";
import { ListingFailure } from "@/src/features/listings/domain/ListingFailure";
import { fake } from "@/__tests__/support/fake";

// Un datasource falso: devuelve las filas que la prueba le diga.
class FakeListingDataSourceState {
  rowsToReturn: Row[] = [];
  errorToThrow: unknown = null;
}

function buildFakeListingDataSource(state: FakeListingDataSourceState) {
  return fake<ListingDataSource>(
    {
      listingById: async (id) => state.rowsToReturn.find((r) => r._id === id) ?? null,
      searchListings: async () => state.rowsToReturn,
      updateListing: async (_id, changes) => {
        if (state.errorToThrow) throw state.errorToThrow;
        return { ...state.rowsToReturn[0], ...changes };
      },
    },
    "ListingDataSource",
  );
}

// Una fila como las que manda el servidor. Cada prueba cambia solo lo que le importa.
function buildRow({
  id = "l_1",
  brand = "Mazda",
  price = "78500000" as unknown,
  createdAt = "2026-09-01T10:00:00Z",
} = {}): Row {
  return {
    _id: id,
    seller_id: "u_ana",
    seller_name: "Ana Torres",
    brand,
    model: "3",
    year: 2021,
    price,
    mileage_km: 42000,
    fuel: "gasoline",
    transmission: "automatic",
    city: "Barranquilla",
    description: "",
    image_1: "https://ejemplo.test/foto.jpg",
    image_2: "",
    image_3: null,
    status: "available",
    created_at: createdAt,
  };
}

describe("ListingRepository", () => {
  let fakeListingDataSource: FakeListingDataSourceState;
  let listingRepository: ListingRepositoryImpl;

  beforeEach(() => {
    fakeListingDataSource = new FakeListingDataSourceState();
    listingRepository = new ListingRepositoryImpl(buildFakeListingDataSource(fakeListingDataSource));
  });

  describe("convertir una fila", () => {
    it("el precio llega como texto y se lee como número", async () => {
      // Postgres manda las columnas `numeric` como cadena.
      fakeListingDataSource.rowsToReturn = [buildRow({ price: "78500000.00" })];

      const listing = await listingRepository.byId("l_1");

      expect(listing!.price).toBe(78500000);
    });

    it("solo cuentan las fotos que tienen URL", async () => {
      fakeListingDataSource.rowsToReturn = [buildRow()];

      const listing = await listingRepository.byId("l_1");

      expect(listing!.images).toEqual(["https://ejemplo.test/foto.jpg"]);
    });

    it("si no existe, devuelve null", async () => {
      expect(await listingRepository.byId("no_existe")).toBeNull();
    });
  });

  describe("buscar", () => {
    it("filtra por marca y pone primero lo más reciente", async () => {
      fakeListingDataSource.rowsToReturn = [
        buildRow({ id: "viejo", brand: "Kia", createdAt: "2026-01-01T00:00:00Z" }),
        buildRow({ id: "otra_marca", brand: "Mazda" }),
        buildRow({ id: "nuevo", brand: "Kia", createdAt: "2026-09-01T00:00:00Z" }),
      ];

      const listings = await listingRepository.search({ ...emptyFilter, brand: "Kia" });

      expect(listings.map((c) => c.id)).toEqual(["nuevo", "viejo"]);
    });
  });

  describe("traducir errores", () => {
    it("un 404 al cambiar el estado dice que no es tuya", async () => {
      // Con propiedad por fila, el servidor responde lo mismo a «no existe» y a «no es tuya».
      fakeListingDataSource.rowsToReturn = [buildRow()];
      fakeListingDataSource.errorToThrow = new RobleApiNotFoundException("No encontrado");

      const failure = await listingRepository.changeStatus("l_1", "sold").catch((e) => e);

      expect(failure).toBeInstanceOf(ListingFailure);
      expect(failure.message).toContain("no es tuya");
    });
  });
});
