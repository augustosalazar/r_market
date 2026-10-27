import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { Container } from "@/src/core/di/container";
import { TOKENS } from "@/src/core/di/tokens";
import { AuthRepository } from "@/src/features/auth/domain/repositories/AuthRepository";
import { CarListing } from "@/src/features/listings/domain/entities/CarListing";
import { ListingFilter } from "@/src/features/listings/domain/entities/ListingFilter";
import { ListingRepository } from "@/src/features/listings/domain/repositories/ListingRepository";
import CatalogScreen from "@/src/features/listings/presentation/screens/CatalogScreen";
import { BrandStrip } from "@/src/features/listings/presentation/components/BrandStrip";
import { VehicleCatalogRepository } from "@/src/features/vehicles/domain/repositories/VehicleCatalogRepository";
import { fake } from "@/__tests__/support/fake";
import { renderScreen } from "@/__tests__/support/renderScreen";

// Una pantalla que lista datos: su view model es de verdad, y los repositorios
// que hay debajo son falsos.
//
// El repositorio falso de publicaciones devuelve lo que la prueba le diga y
// **anota el filtro que le pidieron**. Así se comprueba que tocar una marca
// llega hasta el repositorio sin necesitar datos que filtrar de verdad.
class FakeListingRepositoryState {
  listingsToReturn: CarListing[] = [];
  lastRequestedFilter: ListingFilter | null = null;
}

const buildListing = (id: string, brand: string, model: string): CarListing => ({
  id,
  sellerId: "u_ana",
  sellerName: "Ana Torres",
  brand,
  model,
  year: 2021,
  price: 50000000,
  mileageKm: 30000,
  fuel: "gasoline",
  transmission: "manual",
  city: "Barranquilla",
  description: "",
  images: [],
  status: "available",
  createdAt: new Date(2026, 8, 1),
  buyerId: null,
  buyerName: null,
  soldAt: null,
});

// Se llama **después** de decir qué devuelve el repositorio falso: al montarse,
// la pantalla carga los datos en ese momento.
function openCatalog(state: FakeListingRepositoryState) {
  const listings = fake<ListingRepository>(
    {
      search: async (filter) => {
        state.lastRequestedFilter = filter;
        return state.listingsToReturn;
      },
    },
    "ListingRepository",
  );
  const vehicles = fake<VehicleCatalogRepository>(
    {
      brands: async () => [
        { id: "b_1", name: "Mazda", sortOrder: 1 },
        { id: "b_2", name: "Kia", sortOrder: 2 },
      ],
    },
    "VehicleCatalogRepository",
  );
  // El catálogo pregunta qué carros sigue quien mira, y para eso necesita la
  // sesión. Sin nadie dentro no pide nada más.
  const auth = fake<AuthRepository>(
    { restoreSession: async () => null, onSessionExpired: () => () => {} },
    "AuthRepository",
  );
  const container = new Container()
    .register(TOKENS.ListingRepo, listings)
    .register(TOKENS.VehicleRepo, vehicles)
    .register(TOKENS.AuthRepo, auth);
  return renderScreen(CatalogScreen, container);
}

describe("CatalogScreen", () => {
  let fakeListingRepository: FakeListingRepositoryState;

  beforeEach(() => {
    fakeListingRepository = new FakeListingRepositoryState();
  });

  it("pinta las publicaciones que da el repositorio", async () => {
    fakeListingRepository.listingsToReturn = [buildListing("l_1", "Mazda", "3"), buildListing("l_2", "Kia", "Picanto")];

    openCatalog(fakeListingRepository);

    expect(await screen.findByText("Mazda 3 2021")).toBeTruthy();
    // En Flutter la segunda tarjeta no existía hasta arrastrar la lista
    // (`dragUntilVisible`). `FlatList` construye de entrada las primeras diez,
    // así que en Jest ya está; con muchas más sí habría que desplazarla.
    expect(screen.getByTestId(CatalogScreen.cardKey("l_2"))).toBeTruthy();
    expect(screen.getByText("Kia Picanto 2021")).toBeTruthy();
  });

  it("sin publicaciones dice que no hay resultados", async () => {
    fakeListingRepository.listingsToReturn = [];

    openCatalog(fakeListingRepository);

    expect(await screen.findByText("Sin resultados")).toBeTruthy();
  });

  it("las marcas salen como filtros de un toque", async () => {
    openCatalog(fakeListingRepository);

    expect(await screen.findByTestId(BrandStrip.chipKey(null))).toBeTruthy();
    expect(screen.getByTestId(BrandStrip.chipKey("Mazda"))).toBeTruthy();
    expect(screen.getByTestId(BrandStrip.chipKey("Kia"))).toBeTruthy();
  });

  it("tocar una marca le pide esa marca al repositorio", async () => {
    openCatalog(fakeListingRepository);

    fireEvent.press(await screen.findByTestId(BrandStrip.chipKey("Kia")));

    await waitFor(() => expect(fakeListingRepository.lastRequestedFilter?.brand).toBe("Kia"));
  });
});
