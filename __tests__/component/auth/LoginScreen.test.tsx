import { fireEvent, screen } from "@testing-library/react-native";

import { Container } from "@/src/core/di/container";
import { TOKENS } from "@/src/core/di/tokens";
import { AuthFailure } from "@/src/features/auth/domain/AuthFailure";
import { AuthRepository } from "@/src/features/auth/domain/repositories/AuthRepository";
import LoginScreen from "@/src/features/auth/presentation/screens/LoginScreen";
import { ListingRepository } from "@/src/features/listings/domain/repositories/ListingRepository";
import { fake } from "@/__tests__/support/fake";
import { renderScreen } from "@/__tests__/support/renderScreen";

// Una pantalla con su view model de verdad, y un repositorio falso debajo.
//
// La prueba unitaria del view model ya sabe qué errores produce. Esta comprueba
// lo que solo se ve en pantalla: que se pintan.
//
// f_market tenía además dos pruebas del botón de Google (aparece o no según el
// servidor). r_market no tiene login con Google, así que no hay qué probar.
class FakeAuthRepositoryState {
  failureToThrow: AuthFailure | null = null;
  loginCalls = 0;
}

function openLogin(state: FakeAuthRepositoryState) {
  const auth = fake<AuthRepository>(
    {
      // El provider de sesión, al montarse, recupera la sesión y escucha si
      // caduca. Aquí no hay sesión y nunca caduca.
      restoreSession: async () => null,
      onSessionExpired: () => () => {},
      loginWithEmail: async () => {
        state.loginCalls++;
        throw state.failureToThrow ?? new AuthFailure("Esta prueba no deja entrar.");
      },
    },
    "AuthRepository",
  );
  const container = new Container()
    .register(TOKENS.AuthRepo, auth)
    .register(TOKENS.ListingRepo, fake<ListingRepository>({}, "ListingRepository"));
  return renderScreen(LoginScreen, container);
}

describe("LoginScreen", () => {
  let fakeAuthRepository: FakeAuthRepositoryState;

  beforeEach(() => {
    fakeAuthRepository = new FakeAuthRepositoryState();
  });

  it("un correo mal escrito se ve como error", async () => {
    openLogin(fakeAuthRepository);

    fireEvent.changeText(await screen.findByTestId(LoginScreen.emailFieldKey), "ana");
    fireEvent.press(screen.getByTestId(LoginScreen.submitButtonKey));

    expect(await screen.findByText("Ese correo no parece válido.")).toBeTruthy();
    expect(fakeAuthRepository.loginCalls).toBe(0);
  });

  it("el error del repositorio se ve en pantalla", async () => {
    fakeAuthRepository.failureToThrow = new AuthFailure("Correo o contraseña incorrectos.");
    openLogin(fakeAuthRepository);

    fireEvent.changeText(await screen.findByTestId(LoginScreen.emailFieldKey), "ana@demo.com");
    fireEvent.changeText(screen.getByTestId(LoginScreen.passwordFieldKey), "mala");
    fireEvent.press(screen.getByTestId(LoginScreen.submitButtonKey));

    expect(await screen.findByText("Correo o contraseña incorrectos.")).toBeTruthy();
    expect(fakeAuthRepository.loginCalls).toBe(1);
  });
});
