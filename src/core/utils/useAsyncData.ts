import { useCallback, useEffect, useState } from "react";

import { messageOf } from "./formatters";

// Carga datos al montar y cada vez que cambie `fetch` (que se arma con
// useCallback sobre sus dependencias). El estado solo se toca cuando la promesa
// responde, y una respuesta que llega tarde —ya con otras dependencias— se ignora.
export function useAsyncData<T>(fetch: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    fetch()
      .then((value) => {
        if (!active) return;
        setData(value);
        setError(null);
      })
      .catch((e) => active && setError(messageOf(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [fetch, version]);

  // Vuelve a pedir lo mismo, enseñando que carga.
  const reload = useCallback(() => {
    setLoading(true);
    setVersion((v) => v + 1);
  }, []);

  return { data, setData, loading, error, reload };
}
