import { Row } from "@/src/core/roble/guard";

// Lo que la feature necesita que alguien sepa hablar sobre cuentas.
// Devuelve el perfil tal como llega; convertirlo es del repositorio.
export interface AuthDataSource {
  restoreSession(): Promise<boolean>;
  currentUser(): Promise<Row>;
  login(email: string, password: string): Promise<Row>;
  register(name: string, email: string, password: string): Promise<void>;
  signInAnonymously(): Promise<Row>;
  upgradeAccount(email: string, password: string, name?: string): Promise<Row>;
  readonly isAnonymous: boolean;
  logout(): Promise<void>;
  onSessionExpired(listener: () => void): () => void;
}
