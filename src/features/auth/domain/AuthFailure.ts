export type AuthFailureCode =
  // El correo del ascenso ya tiene cuenta. Roble no fusiona dos cuentas.
  | "ANON_UPGRADE_EMAIL_TAKEN"
  // El proyecto no admite invitados. No es culpa de quien lo intenta.
  | "ANON_UNAVAILABLE"
  // El servidor limita las sesiones de invitado por IP: es temporal.
  | "ANON_RATE_LIMITED";

// Lo que el repositorio de sesión lanza cuando el servidor rechaza al usuario.
export class AuthFailure extends Error {
  constructor(
    message: string,
    readonly code: AuthFailureCode | null = null,
  ) {
    super(message);
    this.name = "AuthFailure";
  }
}
