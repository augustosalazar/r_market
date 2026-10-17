import { RobleAnonUpgradeEmailTakenException, RobleApiHttpException } from "roble-client";

import { AuthDataSource } from "@/src/features/auth/data/datasources/AuthDataSource";
import { AuthRepositoryImpl } from "@/src/features/auth/data/repositories/AuthRepositoryImpl";
import { AuthFailure } from "@/src/features/auth/domain/AuthFailure";
import { fake } from "@/__tests__/support/fake";

// Un datasource falso: devuelve el perfil que la prueba le diga, o lanza el
// error que la prueba le diga. No sale a la red.
//
// Se importa `roble-client` solo por sus excepciones: el trabajo del
// repositorio es traducirlas, y para probarlo hay que lanzar una.
class FakeAuthDataSourceState {
  profileToReturn: Record<string, unknown> = {};
  errorToThrow: unknown = null;
}

function buildFakeAuthDataSource(state: FakeAuthDataSourceState): AuthDataSource {
  const answer = async () => {
    if (state.errorToThrow) throw state.errorToThrow;
    return state.profileToReturn;
  };
  return fake<AuthDataSource>(
    {
      login: answer,
      upgradeAccount: answer,
      // El repositorio lo usa al convertir el perfil; aquí no importa.
      isAnonymous: false,
    },
    "AuthDataSource",
  );
}

describe("AuthRepository", () => {
  let fakeAuthDataSource: FakeAuthDataSourceState;
  let authRepository: AuthRepositoryImpl;

  beforeEach(() => {
    fakeAuthDataSource = new FakeAuthDataSourceState();
    authRepository = new AuthRepositoryImpl(buildFakeAuthDataSource(fakeAuthDataSource));
  });

  describe("convertir el perfil", () => {
    it("la fila del servidor se vuelve un AppUser", async () => {
      fakeAuthDataSource.profileToReturn = { userId: "u_ana", name: "Ana Torres", email: "ana@demo.com" };

      const user = await authRepository.loginWithEmail("ana@demo.com", "123456");

      expect(user.userId).toBe("u_ana");
      expect(user.name).toBe("Ana Torres");
      expect(user.isAnonymous).toBe(false);
    });

    it("un perfil sin nombre se muestra como «Sin nombre»", async () => {
      fakeAuthDataSource.profileToReturn = { userId: "u_1", email: "x@demo.com" };

      const user = await authRepository.loginWithEmail("x@demo.com", "123456");

      expect(user.name).toBe("Sin nombre");
    });
  });

  describe("traducir errores", () => {
    it("un error del servidor llega como AuthFailure con su mensaje", async () => {
      fakeAuthDataSource.errorToThrow = new RobleApiHttpException(400, "Correo con formato invalido");

      await expect(authRepository.loginWithEmail("ana@demo.com", "mala")).rejects.toEqual(
        expect.objectContaining({ name: "AuthFailure", message: "Correo con formato invalido" }),
      );
    });

    it("un 401 al entrar se explica como credenciales malas", async () => {
      // En f_market el mensaje del servidor pasaba tal cual; aquí el 401 se
      // traduce a algo que se le puede enseñar a una persona.
      fakeAuthDataSource.errorToThrow = new RobleApiHttpException(401, "Unauthorized");

      await expect(authRepository.loginWithEmail("ana@demo.com", "mala")).rejects.toThrow(
        "Correo o contraseña incorrectos.",
      );
    });

    it("ascender con un correo que ya existe dice que el correo ya tiene cuenta", async () => {
      // En f_market esta prueba era el 409 de Google; r_market no tiene Google,
      // y el choque que sí existe es el del ascenso de invitado.
      fakeAuthDataSource.errorToThrow = new RobleAnonUpgradeEmailTakenException("Correo registrado");

      const failure = await authRepository.upgradeAccount("ana@demo.com", "123456").catch((e) => e);

      expect(failure).toBeInstanceOf(AuthFailure);
      expect(failure.code).toBe("ANON_UPGRADE_EMAIL_TAKEN");
    });
  });
});
