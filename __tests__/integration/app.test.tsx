import { configure, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import React from "react";

import { AppRoot } from "@/App";
import { DummyData } from "@/src/core/data/dummyData";
import { createLocalContainer } from "@/src/core/di/localContainer";
import LoginScreen from "@/src/features/auth/presentation/screens/LoginScreen";
import MyListingsScreen from "@/src/features/listings/presentation/screens/MyListingsScreen";
import { BrandStrip } from "@/src/features/listings/presentation/components/BrandStrip";
import { ListingCard } from "@/src/features/listings/presentation/components/ListingCard";
import { HomeTabKeys } from "@/src/navigation/RootNavigator";

// La app entera —navegación, pantallas, view models y repositorios de verdad—
// con una sola cosa cambiada: los datasources. `createLocalContainer` le mete
// los de memoria en vez de los de Roble (el `LocalBindings` de f_market), así
// que esto prueba la app y no el servidor, y corre sin red ni cuenta.
//
// Diferencia con f_market: allí era `integration_test/`, que arranca la app en
// un dispositivo o en Chrome. Aquí corre en Jest, como las demás, con los
// componentes nativos simulados. El equivalente en un dispositivo de verdad
// sería Maestro o Detox.
//
// Se toca y se recorre por `testID`; se comprueba por texto lo que la persona lee.

jest.setTimeout(20000);
// La app entera tarda más que una pantalla suelta (latencia simulada, varias
// cargas seguidas): las esperas llegan a 5 s en vez de 1 s.
configure({ asyncUtilTimeout: 5000 });

function startApp() {
  // Cada prueba con su propio backend en memoria: la sesión de una no se cuela
  // en la siguiente (en f_market eso lo hacía `Get.reset`).
  render(<AppRoot container={createLocalContainer(new DummyData({ latencyMs: 20 }))} />);
  return screen.findByText("Chevrolet Onix Turbo 2023");
}

const goToTab = (tab: string) => fireEvent.press(screen.getByTestId(tab));

describe("la app con datos en memoria", () => {
  it("un visitante ve el catálogo sin cuenta", async () => {
    await startApp();

    expect(screen.getByText("Chevrolet Onix Turbo 2023")).toBeTruthy();
    expect(screen.getAllByText("Disponible").length).toBeGreaterThan(0);
  });

  it("tocar una marca filtra el catálogo", async () => {
    await startApp();

    // Las marcas se cargan después de las publicaciones: hay que esperarlas.
    fireEvent.press(await screen.findByTestId(BrandStrip.chipKey("Renault")));

    // De las publicaciones de prueba, el único Renault es el Duster, y el
    // Chevrolet que iba primero desaparece.
    expect(await screen.findByText(/Duster/)).toBeTruthy();
    await waitFor(() => expect(screen.queryByText("Chevrolet Onix Turbo 2023")).toBeNull());
  });

  it("entrar con la cuenta de demo", async () => {
    await startApp();

    // «Lo mío» sin sesión ofrece entrar.
    goToTab(HomeTabKeys.mine);
    fireEvent.press(await screen.findByTestId(MyListingsScreen.signInButtonKey));

    // En f_market el login venía precargado con la cuenta de demo; aquí la
    // pantalla de producción arranca vacía y la prueba la escribe.
    fireEvent.changeText(await screen.findByTestId(LoginScreen.emailFieldKey), DummyData.demoEmail);
    fireEvent.changeText(screen.getByTestId(LoginScreen.passwordFieldKey), DummyData.demoPassword);
    fireEvent.press(screen.getByTestId(LoginScreen.submitButtonKey));
    await waitFor(() => expect(screen.queryByTestId(LoginScreen.submitButtonKey)).toBeNull());

    // De vuelta en la app, el perfil es el de Ana.
    goToTab(HomeTabKeys.profile);
    expect(await screen.findByText("Ana Torres")).toBeTruthy();
  });

  it("seguir sin cuenta abre una sesión de invitado", async () => {
    await startApp();

    // Sin pasar por el login: seguir es el gesto de quien todavía mira.
    fireEvent.press(screen.getAllByTestId(ListingCard.followButtonKey)[0]);
    expect(await screen.findByLabelText("Dejar de seguir")).toBeTruthy();
    expect(screen.queryByTestId(LoginScreen.submitButtonKey)).toBeNull();

    // Y lo seguido es suyo: aparece en «Lo mío», sin haber creado cuenta.
    goToTab(HomeTabKeys.mine);
    fireEvent.press(await screen.findByTestId(MyListingsScreen.followingTabKey));
    // Las pestañas siguen montadas (como el `IndexedStack` de f_market), así que
    // el Onix también está en el catálogo: se busca dentro de la lista de «Lo mío».
    await waitFor(() =>
      expect(within(screen.getByTestId(MyListingsScreen.listKey)).getByText("Chevrolet Onix Turbo 2023")).toBeTruthy(),
    );
  });
});
