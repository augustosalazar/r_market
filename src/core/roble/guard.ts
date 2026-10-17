import { RobleApiException, RobleApiHttpException } from "roble-client";

// Aquí mueren las excepciones del paquete: cada repositorio las traduce al
// `Failure` de su feature, para que la pantalla no vea nunca un código HTTP.
//
// Un 404 con propiedad por fila significa «no existe **o** no es tuya»: el
// servidor contesta igual a propósito. `notFound` deja decirlo bien.
export async function guardRoble<T>(
  action: () => Promise<T>,
  toFailure: (message: string) => Error,
  options: { notFound?: string } = {},
): Promise<T> {
  try {
    return await action();
  } catch (e) {
    if (e instanceof RobleApiHttpException) {
      if (e.statusCode === 404 && options.notFound) throw toFailure(options.notFound);
      if (e.statusCode === 403) throw toFailure("Tu cuenta no puede hacer esto.");
      throw toFailure(e.message);
    }
    if (e instanceof RobleApiException) throw toFailure(e.message);
    throw e;
  }
}

// Fechas: Roble devuelve ISO; las filas viejas pueden traer nulos.
export function parseDate(value: unknown, fallback = new Date(0)): Date {
  if (value == null || value === "") return fallback;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// Una columna nueva llega nula en las filas de antes, y vacía no es lo mismo que
// puesta: las dos significan «sin valor».
export function textOrNull(value: unknown): string | null {
  const text = value == null ? "" : String(value).trim();
  return text ? text : null;
}

export type Row = Record<string, any>;
