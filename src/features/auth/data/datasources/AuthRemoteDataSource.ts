import { RobleClient } from "@/src/core/roble/RobleClient";
import { AuthDataSource } from "./AuthDataSource";

// Habla con Roble sobre cuentas. No decide nada y deja subir las excepciones.
export class AuthRemoteDataSource implements AuthDataSource {
  constructor(private readonly client: RobleClient) {}

  restoreSession() {
    return this.client.db.restoreSession();
  }

  currentUser() {
    return this.client.db.currentUser();
  }

  login(email: string, password: string) {
    return this.client.db.login({ email, password });
  }

  async register(name: string, email: string, password: string) {
    await this.client.db.register({ email, password, name });
  }

  async signInAnonymously() {
    return this.client.db.signInAnonymously();
  }

  async upgradeAccount(email: string, password: string, name?: string) {
    // Sin verificación: el proyecto no tiene correo saliente, y una cuenta
    // esperando un código que no llega queda inservible.
    await this.client.db.upgradeAccount({ email, password, name });
    return this.client.db.currentUser();
  }

  get isAnonymous() {
    return this.client.db.isAnonymous;
  }

  logout() {
    return this.client.db.logout();
  }

  onSessionExpired(listener: () => void) {
    return this.client.db.onSessionExpired(listener);
  }
}
