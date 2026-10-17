import {
  RobleAnonUpgradeEmailTakenException,
  RobleAnonymousAuthException,
  RobleApiException,
  RobleApiHttpException,
} from "roble-client";

import { Row } from "@/src/core/roble/guard";
import { AuthFailure } from "../../domain/AuthFailure";
import { AppUser } from "../../domain/entities/AppUser";
import { AuthRepository } from "../../domain/repositories/AuthRepository";
import { AuthDataSource } from "../datasources/AuthDataSource";

// Sesión: decide y traduce, no habla. El paquete guarda y refresca los tokens.
export class AuthRepositoryImpl implements AuthRepository {
  constructor(private readonly source: AuthDataSource) {}

  onSessionExpired(listener: () => void) {
    return this.source.onSessionExpired(listener);
  }

  async restoreSession(): Promise<AppUser | null> {
    if (!(await this.source.restoreSession())) return null;
    return this.guard(async () => this.toUser(await this.source.currentUser()));
  }

  loginWithEmail(email: string, password: string) {
    return this.guard(async () => this.toUser(await this.source.login(email, password)));
  }

  registerWithEmail(name: string, email: string, password: string) {
    return this.guard(async () => {
      // `register` crea la cuenta pero no deja sesión: se entra a continuación.
      await this.source.register(name, email, password);
      return this.toUser(await this.source.login(email, password));
    });
  }

  signInAnonymously() {
    return this.guard(async () => this.toUser(await this.source.signInAnonymously()), { guest: true });
  }

  upgradeAccount(email: string, password: string, name?: string) {
    return this.guard(async () => this.toUser(await this.source.upgradeAccount(email, password, name)));
  }

  logout() {
    return this.source.logout();
  }

  private toUser(profile: Row): AppUser {
    return {
      // `userId` es el del usuario; `id` es el de la fila del perfil.
      userId: String(profile.userId),
      name: (profile.name as string | undefined) || "Sin nombre",
      email: (profile.email as string | undefined) ?? "",
      // El token es la fuente buena: tras ascender, se renueva en la misma llamada.
      isAnonymous: profile.isAnonymous === true || this.source.isAnonymous,
    };
  }

  private async guard(action: () => Promise<AppUser>, options: { guest?: boolean } = {}): Promise<AppUser> {
    const guestUnavailable = (detail: string) =>
      new AuthFailure(`Entrar sin cuenta no está disponible ahora mismo. (${detail})`, "ANON_UNAVAILABLE");
    try {
      return await action();
    } catch (e) {
      if (e instanceof RobleAnonUpgradeEmailTakenException) {
        throw new AuthFailure(
          "Ya hay una cuenta con ese correo. Si es tuya, entra con ella: lo que guardaste como invitado se queda en esta sesión.",
          "ANON_UPGRADE_EMAIL_TAKEN",
        );
      }
      // ANON_AUTH_DISABLED y ANON_REQUIRES_ROW_OWNERSHIP: las dos mitades de la
      // misma configuración, y ninguna es culpa de quien entra.
      if (e instanceof RobleAnonymousAuthException) throw guestUnavailable(e.message);
      if (e instanceof RobleApiHttpException) {
        if (options.guest && e.statusCode === 429) {
          throw new AuthFailure(
            "Demasiados invitados desde esta conexión. Espera un momento, o entra con tu cuenta.",
            "ANON_RATE_LIMITED",
          );
        }
        if (options.guest) throw guestUnavailable(e.message);
        if (e.statusCode === 401) throw new AuthFailure("Correo o contraseña incorrectos.");
        throw new AuthFailure(e.message);
      }
      if (e instanceof RobleApiException) {
        throw options.guest ? guestUnavailable(e.message) : new AuthFailure(e.message);
      }
      throw e;
    }
  }
}
