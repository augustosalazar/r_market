// Estado de una publicación. Un cambio de estado avisa a los seguidores.
export type ListingStatus = "available" | "reserved" | "sold" | "withdrawn";
export const LISTING_STATUSES: ListingStatus[] = ["available", "reserved", "sold", "withdrawn"];
export const statusLabel: Record<ListingStatus, string> = {
  available: "Disponible",
  reserved: "Reservado",
  sold: "Vendido",
  withdrawn: "Retirado",
};
export function statusFromName(name: unknown): ListingStatus {
  return LISTING_STATUSES.includes(name as ListingStatus) ? (name as ListingStatus) : "available";
}

export type FuelType = "gasoline" | "diesel" | "hybrid" | "electric" | "gas";
export const FUEL_TYPES: FuelType[] = ["gasoline", "diesel", "hybrid", "electric", "gas"];
export const fuelLabel: Record<FuelType, string> = {
  gasoline: "Gasolina",
  diesel: "Diesel",
  hybrid: "Híbrido",
  electric: "Eléctrico",
  gas: "Gas",
};

export type TransmissionType = "manual" | "automatic";
export const TRANSMISSION_TYPES: TransmissionType[] = ["manual", "automatic"];
export const transmissionLabel: Record<TransmissionType, string> = {
  manual: "Mecánica",
  automatic: "Automática",
};

export const MAX_IMAGES = 3;

// Una publicación de venta de carro.
export type CarListing = {
  id: string;
  sellerId: string;
  sellerName: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileageKm: number;
  fuel: FuelType;
  transmission: TransmissionType;
  city: string;
  description: string;
  // Como máximo tres URLs. Vacío mientras el proyecto no tenga almacenamiento.
  images: string[];
  status: ListingStatus;
  createdAt: Date;
  // Quién compró, cuando la venta quedó registrada: lo que la vuelve una línea
  // del historial de compras y lo que habilita que las dos partes se califiquen.
  buyerId: string | null;
  buyerName: string | null;
  soldAt: Date | null;
};

export const listingTitle = (l: Pick<CarListing, "brand" | "model" | "year">) => `${l.brand} ${l.model} ${l.year}`;
export const listingCover = (l: CarListing) => l.images[0] ?? null;

// Una venta registrada: vendida **y** con comprador.
export const hasRegisteredSale = (l: CarListing) => l.status === "sold" && !!l.buyerId;
