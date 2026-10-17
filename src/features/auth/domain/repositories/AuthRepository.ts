import { AppUser } from "../entities/AppUser";

// El contrato de sesión. La UI depende de esto, nunca de Roble.
export interface AuthRepository {
  // El usuario de la sesión guardada, o `null` si no hay ninguna.
  restoreSession(): Promise<AppUser | null>;

  // Avisa cuando la sesión se cae sola, no cuando se cierra a propósito.
  // Devuelve la función para dejar de escuchar.
  onSessionExpired(listener: () => void): () => void;

  loginWithEmail(email: string, password: string): Promise<AppUser>;
  registerWithEmail(name: string, email: string, password: string): Promise<AppUser>;

  // Entra como invitado: sin correo ni clave, pero con `userId` propio.
  signInAnonymously(): Promise<AppUser>;

  // Asciende al invitado a una cuenta conservando todo lo suyo (mismo userId).
  // Lanza `AuthFailure` con code ANON_UPGRADE_EMAIL_TAKEN si el correo ya existe.
  upgradeAccount(email: string, password: string, name?: string): Promise<AppUser>;

  logout(): Promise<void>;
}
