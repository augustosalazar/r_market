import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { TOKENS } from "@/src/core/di/tokens";
import { useInject } from "@/src/core/di/DIProvider";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { goToLogin } from "@/src/navigation/navigationRef";
import { AuthFailure, AuthFailureCode } from "../../domain/AuthFailure";
import { AppUser } from "../../domain/entities/AppUser";
import { AuthRepository } from "../../domain/repositories/AuthRepository";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type AccountForm = { name: string; email: string; password: string; confirmation: string };

export type SessionViewModel = {
  // `false` mientras se recupera la sesión guardada (el splash sigue visible).
  ready: boolean;
  user: AppUser | null;
  busy: boolean;
  error: string | null;
  clearError: () => void;
  // El `code` del último fallo, leído al momento (no el del último render).
  lastFailureCode: () => AuthFailureCode | null;

  isLoggedIn: boolean;
  // Entró sin cuenta: tiene sesión y escribe lo suyo, pero no tiene correo con
  // el que volver. Por eso se le ofrece «guarda tu cuenta» y no «cerrar sesión».
  isGuest: boolean;
  // Una cuenta de verdad: lo que exigen publicar, chatear y calificar.
  hasAccount: boolean;

  // El nombre que un invitado eligió para firmar. Vive solo en la sesión.
  guestName: string | null;
  // Con qué nombre se firma lo que esta persona escribe.
  displayName: string;
  needsDisplayName: boolean;
  setGuestName: (value: string) => boolean;

  login: (email: string, password: string) => Promise<boolean>;
  register: (form: AccountForm) => Promise<boolean>;
  upgrade: (form: AccountForm) => Promise<boolean>;
  logout: () => Promise<void>;

  // El usuario de ahora mismo. Para las acciones que lo necesitan justo después
  // de `ensureWritableSession`, antes de que el estado nuevo llegue al render.
  currentUser: () => AppUser | null;

  // Garantiza una **cuenta** antes de publicar, chatear o calificar. Si no la
  // hay, manda al login y responde `false`: la acción se repite al volver.
  ensureLoggedIn: () => boolean;
  // Garantiza **algo** con lo que escribir (seguir, preguntar): si no hay
  // sesión, abre una de invitado.
  ensureWritableSession: () => Promise<boolean>;
};

const SessionContext = createContext<SessionViewModel | undefined>(undefined);

// Quién está dentro. Vive toda la vida de la app: el catálogo es público, así
// que la sesión es un dato transversal y no el dueño de una pantalla.
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const auth = useInject<AuthRepository>(TOKENS.AuthRepo);
  const snackbar = useSnackbar();

  const [ready, setReady] = useState(false);
  const [user, setUserState] = useState<AppUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestName, setGuestNameState] = useState<string | null>(null);

  // Las acciones leen el usuario de aquí y no del estado: así no se quedan con
  // uno viejo entre renders.
  const userRef = useRef<AppUser | null>(null);
  const lastCodeRef = useRef<AuthFailureCode | null>(null);
  const setUser = useCallback((u: AppUser | null) => {
    userRef.current = u;
    setUserState(u);
  }, []);

  useEffect(() => {
    let active = true;
    auth
      .restoreSession()
      .catch(() => null)
      .then((restored) => {
        if (!active) return;
        // Si alguien entró mientras se recuperaba la sesión, gana lo nuevo.
        if (!userRef.current) setUser(restored);
        setReady(true);
      });
    // Caducar y cerrar sesión dejan los dos sin sesión, pero solo uno merece
    // explicación: el paquete no avisa aquí en `logout()`.
    const stop = auth.onSessionExpired(() => {
      if (!userRef.current) return;
      setUser(null);
      setGuestNameState(null);
      snackbar("Tu sesión caducó. Vuelve a entrar.", { error: true });
      goToLogin();
    });
    return () => {
      active = false;
      stop();
    };
  }, [auth, setUser, snackbar]);

  const fail = useCallback((message: string) => {
    lastCodeRef.current = null;
    setError(message);
    return false;
  }, []);

  const run = useCallback(
    async (action: () => Promise<AppUser>): Promise<boolean> => {
      setBusy(true);
      setError(null);
      lastCodeRef.current = null;
      try {
        setUser(await action());
        return true;
      } catch (e) {
        if (e instanceof AuthFailure) {
          lastCodeRef.current = e.code;
          setError(e.message);
        } else {
          setError("No se pudo completar la operación. Intenta de nuevo.");
        }
        return false;
      } finally {
        setBusy(false);
      }
    },
    [setUser],
  );

  const validateAccount = useCallback(
    (f: AccountForm): string | null => {
      if (f.name.trim().length < 3) return "Tu nombre debe tener al menos 3 caracteres.";
      if (!EMAIL_RE.test(f.email.trim())) return "Ese correo no parece válido.";
      if (f.password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
      if (f.password !== f.confirmation) return "Las contraseñas no coinciden.";
      return null;
    },
    [],
  );

  const login = useCallback(
    (email: string, password: string) => {
      if (!EMAIL_RE.test(email.trim())) return Promise.resolve(fail("Ese correo no parece válido."));
      if (!password) return Promise.resolve(fail("Escribe tu contraseña."));
      return run(() => auth.loginWithEmail(email.trim(), password));
    },
    [auth, fail, run],
  );

  const register = useCallback(
    (f: AccountForm) => {
      const invalid = validateAccount(f);
      if (invalid) return Promise.resolve(fail(invalid));
      return run(() => auth.registerWithEmail(f.name.trim(), f.email.trim(), f.password));
    },
    [auth, fail, run, validateAccount],
  );

  const upgrade = useCallback(
    (f: AccountForm) => {
      const invalid = validateAccount(f);
      if (invalid) return Promise.resolve(fail(invalid));
      return run(async () => {
        const account = await auth.upgradeAccount(f.email.trim(), f.password, f.name.trim());
        // Ya es el nombre de la cuenta: dos fuentes para lo mismo sobran.
        setGuestNameState(null);
        return account;
      });
    },
    [auth, fail, run, validateAccount],
  );

  const logout = useCallback(async () => {
    await auth.logout();
    setUser(null);
    setGuestNameState(null);
  }, [auth, setUser]);

  const ensureLoggedIn = useCallback(() => {
    const u = userRef.current;
    if (u && !u.isAnonymous) return true;
    goToLogin();
    return false;
  }, []);

  const ensureWritableSession = useCallback(async () => {
    if (userRef.current) return true;
    if (await run(() => auth.signInAnonymously())) return true;
    // Solo se cae al login cuando el proyecto no admite invitados. Un límite
    // temporal o un fallo de red se cuentan y ya.
    if (lastCodeRef.current !== "ANON_UNAVAILABLE") {
      snackbar("No se pudo entrar como invitado. Intenta en un momento.", { error: true });
      return false;
    }
    setError(null);
    return ensureLoggedIn();
  }, [auth, ensureLoggedIn, run, snackbar]);

  const setGuestName = useCallback((value: string) => {
    const clean = value.trim();
    if (clean.length < 3) {
      setError("Escribe un nombre de al menos 3 caracteres.");
      return false;
    }
    setGuestNameState(clean);
    return true;
  }, []);

  // Estable: las pantallas lo llaman en un efecto al montarse, y una función
  // nueva en cada render lo volvería a disparar borrando cada error recién puesto.
  const clearError = useCallback(() => setError(null), []);

  const isGuest = user?.isAnonymous ?? false;
  const value = useMemo<SessionViewModel>(
    () => ({
      ready,
      user,
      busy,
      error,
      clearError,
      lastFailureCode: () => lastCodeRef.current,
      isLoggedIn: user != null,
      isGuest,
      hasAccount: user != null && !isGuest,
      guestName,
      displayName: guestName ?? user?.name ?? "",
      needsDisplayName: isGuest && guestName == null,
      setGuestName,
      login,
      register,
      upgrade,
      logout,
      currentUser: () => userRef.current,
      ensureLoggedIn,
      ensureWritableSession,
    }),
    [ready, user, busy, error, clearError, isGuest, guestName, setGuestName, login, register, upgrade, logout, ensureLoggedIn, ensureWritableSession],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
