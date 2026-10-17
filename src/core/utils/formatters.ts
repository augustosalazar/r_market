// Formatos que se repiten en varias pantallas. Escritos a mano y no con
// `toLocaleString`: el Intl de Hermes no trae todos los locales en Android.
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function thousands(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export const Formatters = {
  price: (value: number) => `$ ${thousands(value)}`,

  mileage: (km: number) => `${thousands(km)} km`,

  date: (value: Date) => `${value.getDate()} ${MONTHS[value.getMonth()]} ${value.getFullYear()}`,

  // Antigüedad en palabras: «hace 3 h». Para listas y chats.
  relative(value: Date, now: Date = new Date()): string {
    const minutes = Math.floor((now.getTime() - value.getTime()) / 60000);
    if (minutes < 1) return "ahora";
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `hace ${days} d`;
    return Formatters.date(value);
  },

  time: (value: Date) =>
    `${value.getHours().toString().padStart(2, "0")}:${value.getMinutes().toString().padStart(2, "0")}`,
};

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Un mensaje que se le puede enseñar a una persona, venga de donde venga.
export function messageOf(e: unknown, fallback = "Algo salió mal. Intenta de nuevo."): string {
  return e instanceof Error && e.message ? e.message : fallback;
}
