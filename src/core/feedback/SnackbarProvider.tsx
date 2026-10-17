import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Snackbar, useTheme } from "react-native-paper";

type Show = (text: string, options?: { error?: boolean }) => void;

const SnackbarContext = createContext<Show | null>(null);

// La barra inferior de avisos, una para toda la app. Los view models no pintan
// nada: llaman a `useSnackbar()` y la barra lo muestra.
export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const [current, setCurrent] = useState<{ text: string; error: boolean; key: number } | null>(null);

  const show = useCallback<Show>((text, options) => {
    setCurrent({ text, error: options?.error ?? false, key: Date.now() });
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        key={current?.key}
        visible={current != null}
        onDismiss={() => setCurrent(null)}
        duration={3500}
        style={current?.error ? { backgroundColor: theme.colors.errorContainer } : undefined}
        theme={current?.error ? { colors: { inverseOnSurface: theme.colors.onErrorContainer } } : undefined}
      >
        {current?.text ?? ""}
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): Show {
  // Fuera del provider (en pruebas de una pieza suelta) no hay barra: se ignora.
  return useContext(SnackbarContext) ?? noop;
}

const noop: Show = () => {};
