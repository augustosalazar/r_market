import { DummyData } from "@/src/core/data/dummyData";
import { AuthDataSource } from "./AuthDataSource";

// Cuentas en memoria. La sesión no sobrevive a cerrar la app, así que
// `restoreSession` solo encuentra algo dentro de la misma corrida.
export class AuthInMemoryDataSource implements AuthDataSource {
  constructor(private readonly data: DummyData) {}

  async restoreSession() {
    await this.data.delay(0.5);
    return this.data.session != null;
  }

  async currentUser() {
    if (!this.data.session) throw new Error("No hay sesión");
    return this.data.session;
  }

  async login(email: string, password: string) {
    await this.data.delay();
    const user = this.data.users.find((u) => String(u.email).toLowerCase() === email.toLowerCase());
    if (!user || this.data.passwords[user.email] !== password) {
      throw new Error("Correo o contraseña incorrectos.");
    }
    this.data.session = user;
    return user;
  }

  async register(name: string, email: string, password: string) {
    await this.data.delay();
    const normalized = email.toLowerCase();
    if (this.data.users.some((u) => String(u.email).toLowerCase() === normalized)) {
      throw new Error("Ya existe una cuenta con ese correo.");
    }
    this.data.users.push({ userId: this.data.nextId("u"), name, email: normalized });
    this.data.passwords[normalized] = password;
  }

  async signInAnonymously() {
    await this.data.delay();
    const id = this.data.nextId("u");
    // La misma dirección inventada que pone el servidor: no existe y no se muestra.
    const guest = { userId: id, name: "Invitado", email: `anon_${id}@anonymous.invalid`, isAnonymous: true };
    this.data.users.push(guest);
    this.data.session = guest;
    return guest;
  }

  async upgradeAccount(email: string, password: string, name?: string) {
    await this.data.delay();
    const guest = this.data.session;
    if (!guest || guest.isAnonymous !== true) throw new Error("Esta cuenta ya no es un invitado.");
    const normalized = email.toLowerCase();
    if (this.data.users.some((u) => String(u.email).toLowerCase() === normalized && u.userId !== guest.userId)) {
      throw new Error("Ya existe una cuenta con ese correo.");
    }
    // **Muta la fila que ya hay**, como el servidor: el `userId` no cambia.
    guest.email = normalized;
    guest.name = name?.trim() || guest.name;
    guest.isAnonymous = false;
    this.data.passwords[normalized] = password;
    return guest;
  }

  get isAnonymous() {
    return this.data.session?.isAnonymous === true;
  }

  async logout() {
    await this.data.delay(0.5);
    this.data.session = null;
  }

  // Una sesión en memoria no caduca sola: nunca avisa.
  onSessionExpired() {
    return () => {};
  }
}
