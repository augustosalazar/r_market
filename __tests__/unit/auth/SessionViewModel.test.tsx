import { act, renderHook } from "@testing-library/react-native";
import React from "react";

import { Container } from "@/src/core/di/container";
import { DIProvider } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { AuthFailure } from "@/src/features/auth/domain/AuthFailure";
import { AppUser } from "@/src/features/auth/domain/entities/AppUser";
import { AuthRepository } from "@/src/features/auth/domain/repositories/AuthRepository";
import { SessionProvider, useSession } from "@/src/features/auth/presentation/context/SessionContext";
import { fake } from "@/__tests__/support/fake";

// Un repositorio falso: devuelve lo que la prueba le diga.
//
// Diferencia con f_market: allí el view model era una clase y la prueba la
// construía con `SessionViewModel(fake)`. Aquí es un contexto de React, así que
// se monta con `renderHook` dentro de su provider. Y al montarse, el provider
// recupera la sesión guardada y se suscribe a su caída: el falso tiene que
// contestar esas dos cosas aunque la prueba no las mire.
class FakeAuthRepositoryState {
  userToReturn: AppUser | null = null;
  failureToThrow: AuthFailure | null = null;
  loginCalls = 0;
}

const ana: AppUser = { userId: "u_ana", name: "Ana Torres", email: "ana@demo.com", isAnonymous: false };
const guest: AppUser = { userId: "u_invitado", name: "Invitado", email: "", isAnonymous: true };

function renderSession(state: FakeAuthRepositoryState) {
  const repo = fake<AuthRepository>(
    {
      restoreSession: async () => null,
      onSessionExpired: () => () => {},
      loginWithEmail: async () => {
        state.loginCalls++;
        if (state.failureToThrow) throw state.failureToThrow;
        return state.userToReturn!;
      },
      signInAnonymously: async () => guest,
    },
    "AuthRepository",
  );
  const container = new Container().register(TOKENS.AuthRepo, repo);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <DIProvider container={container}>
      <SessionProvider>{children}</SessionProvider>
    </DIProvider>
  );
  return renderHook(() => useSession(), { wrapper });
}

describe("SessionViewModel", () => {
  let fakeAuthRepository: FakeAuthRepositoryState;

  beforeEach(() => {
    fakeAuthRepository = new FakeAuthRepositoryState();
  });

  describe("validaciones", () => {
    it("un correo mal escrito no llega al repositorio", async () => {
      const { result } = renderSession(fakeAuthRepository);

      let signedIn = true;
      await act(async () => {
        signedIn = await result.current.login("ana", "123456");
      });

      expect(signedIn).toBe(false);
      expect(result.current.error).toBe("Ese correo no parece válido.");
      expect(fakeAuthRepository.loginCalls).toBe(0);
    });

    it("sin contraseña no llega al repositorio", async () => {
      const { result } = renderSession(fakeAuthRepository);

      let signedIn = true;
      await act(async () => {
        signedIn = await result.current.login("ana@demo.com", "");
      });

      expect(signedIn).toBe(false);
      expect(result.current.error).toBe("Escribe tu contraseña.");
      expect(fakeAuthRepository.loginCalls).toBe(0);
    });

    it("al registrarse, las contraseñas tienen que coincidir", async () => {
      const { result } = renderSession(fakeAuthRepository);

      let signedIn = true;
      await act(async () => {
        signedIn = await result.current.register({
          name: "Ana Torres",
          email: "ana@demo.com",
          password: "123456",
          confirmation: "654321",
        });
      });

      expect(signedIn).toBe(false);
      expect(result.current.error).toBe("Las contraseñas no coinciden.");
    });
  });

  describe("estado", () => {
    it("entrar guarda al usuario y apaga la carga", async () => {
      fakeAuthRepository.userToReturn = ana;
      const { result } = renderSession(fakeAuthRepository);

      let signedIn = false;
      await act(async () => {
        signedIn = await result.current.login("ana@demo.com", "123456");
      });

      expect(signedIn).toBe(true);
      expect(result.current.user).toEqual(ana);
      expect(result.current.busy).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("si el repositorio falla, se muestra su mensaje", async () => {
      fakeAuthRepository.failureToThrow = new AuthFailure("Correo o contraseña incorrectos.");
      const { result } = renderSession(fakeAuthRepository);

      let signedIn = true;
      await act(async () => {
        signedIn = await result.current.login("ana@demo.com", "mala");
      });

      expect(signedIn).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBe("Correo o contraseña incorrectos.");
      expect(result.current.busy).toBe(false);
    });
  });

  describe("invitados", () => {
    it("un invitado tiene sesión pero no cuenta", async () => {
      const { result } = renderSession(fakeAuthRepository);

      // En f_market la prueba escribía `user.value` directamente. Un contexto de
      // React no deja escribir su estado desde fuera: se llega por la acción
      // real, que es abrir una sesión de invitado.
      await act(async () => {
        await result.current.ensureWritableSession();
      });

      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.isGuest).toBe(true);
      expect(result.current.hasAccount).toBe(false);
    });
  });
});
