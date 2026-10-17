import { RobleApiHttpException } from "roble-client";

import { guardRoble, parseDate, Row, textOrNull, toNumber } from "@/src/core/roble/guard";
import {
  CarListing,
  FUEL_TYPES,
  FuelType,
  ListingStatus,
  statusFromName,
  TRANSMISSION_TYPES,
  TransmissionType,
} from "../../domain/entities/CarListing";
import { ListingFilter, matchesFilter } from "../../domain/entities/ListingFilter";
import { ListingFailure } from "../../domain/ListingFailure";
import { ListingRepository } from "../../domain/repositories/ListingRepository";
import { ListingDataSource } from "../datasources/ListingDataSource";

const failure = (m: string) => new ListingFailure(m);
const newestFirst = (a: CarListing, b: CarListing) => b.createdAt.getTime() - a.createdAt.getTime();

// El catálogo: decide y traduce, no habla.
export class ListingRepositoryImpl implements ListingRepository {
  constructor(private readonly source: ListingDataSource) {}

  async search(filter: ListingFilter): Promise<CarListing[]> {
    const text = filter.query.trim().toLowerCase();
    const rows = await guardRoble(
      () =>
        this.source.searchListings({
          text,
          brand: filter.brand,
          minPrice: filter.minPrice,
          maxPrice: filter.maxPrice,
          minYear: filter.minYear,
        }),
      failure,
    );
    // Sin cuenta la fuente devuelve de más: volver a filtrar deja la regla en un sitio.
    return rows.map(toListing).filter((l) => matchesFilter(l, filter)).sort(newestFirst);
  }

  async byId(id: string) {
    const row = await guardRoble(() => this.source.listingById(id), failure);
    return row ? toListing(row) : null;
  }

  async bySeller(sellerId: string) {
    const rows = await guardRoble(() => this.source.readListings({ seller_id: sellerId }), failure);
    return rows.map(toListing).sort(newestFirst);
  }

  async create(l: Omit<CarListing, "id">) {
    const row = await guardRoble(
      () =>
        this.source.createListing({
          seller_id: l.sellerId,
          seller_name: l.sellerName,
          brand: l.brand,
          model: l.model,
          year: l.year,
          price: l.price,
          mileage_km: l.mileageKm,
          fuel: l.fuel,
          transmission: l.transmission,
          city: l.city,
          description: l.description,
          // Tres columnas y no una lista: la API rechaza arrays JSON en jsonb.
          // Solo viajan URLs: una ruta del teléfono no le sirve a nadie más.
          image_1: urlOrNull(l.images[0]),
          image_2: urlOrNull(l.images[1]),
          image_3: urlOrNull(l.images[2]),
          status: l.status,
          created_at: l.createdAt.toISOString(),
        }),
      failure,
    );
    return toListing(row);
  }

  async changeStatus(listingId: string, status: ListingStatus) {
    const row = await guardRoble(
      () =>
        this.source.updateListing(listingId, {
          status,
          // Sacarla de «vendido» borra al comprador: si no, volvería al catálogo
          // contando como compra de alguien.
          ...(status !== "sold" ? { buyer_id: null, buyer_name: null, sold_at: null } : {}),
        }),
      failure,
      {
        // `listing` está acotada por dueño: a quien no lo sea, el servidor le
        // responde 404, el mismo que si no existiera.
        notFound:
          "El estado no se pudo cambiar: la publicación ya no existe, o no es tuya. Solo su vendedor puede cambiarla.",
      },
    );
    return toListing(row);
  }

  async markSold(listingId: string, buyerId: string, buyerName: string) {
    const row = await guardRoble(
      () =>
        this.source.updateListing(listingId, {
          status: "sold",
          buyer_id: buyerId,
          buyer_name: buyerName,
          sold_at: new Date().toISOString(),
        }),
      failure,
      {
        notFound:
          "La venta no se pudo registrar: la publicación ya no existe, o no es tuya. Solo su vendedor puede cerrarla.",
      },
    );
    return toListing(row);
  }

  async purchasesOf(userId: string) {
    const rows = await guardRoble(() => this.source.readListings({ buyer_id: userId }), failure);
    // Por la fecha de la venta: lo que ordena un historial de compras.
    const when = (l: CarListing) => (l.soldAt ?? l.createdAt).getTime();
    return rows.map(toListing).sort((a, b) => when(b) - when(a));
  }

  async followedBy(userId: string) {
    const ids = await this.followedIds(userId);
    if (ids.size === 0) return [];
    const rows = await guardRoble(() => this.source.listingsByIds([...ids]), failure);
    return rows.map(toListing).sort(newestFirst);
  }

  async followedIds(userId: string) {
    const rows = await guardRoble(() => this.source.readFollows({ user_id: userId }), failure);
    return new Set(rows.map((r) => String(r.listing_id)));
  }

  async toggleFollow(listingId: string, userId: string) {
    const existing = await guardRoble(
      () => this.source.readFollows({ listing_id: listingId, user_id: userId }),
      failure,
    );
    if (existing.length > 0) {
      try {
        await this.source.deleteFollow(String(existing[0]._id));
      } catch (e) {
        // Dejar de seguir dos veces a la vez: lo que importaba ya se cumplió.
        if (!(e instanceof RobleApiHttpException && e.statusCode === 404)) {
          return guardRoble(() => Promise.reject(e), failure);
        }
      }
      return false;
    }
    await guardRoble(
      () => this.source.createFollow({ listing_id: listingId, user_id: userId, created_at: new Date().toISOString() }),
      failure,
    );
    return true;
  }

  async followerIdsOf(listingId: string) {
    const rows = await guardRoble(() => this.source.readFollows({ listing_id: listingId }), failure);
    return rows.map((r) => String(r.user_id));
  }
}

const urlOrNull = (path?: string) => (path && path.startsWith("http") ? path : null);

export function toListing(row: Row): CarListing {
  return {
    id: String(row._id),
    sellerId: String(row.seller_id),
    sellerName: (row.seller_name as string) || "Sin nombre",
    brand: String(row.brand),
    model: String(row.model),
    year: toNumber(row.year),
    // `numeric` puede viajar como cadena.
    price: toNumber(row.price),
    mileageKm: toNumber(row.mileage_km),
    fuel: FUEL_TYPES.includes(row.fuel) ? (row.fuel as FuelType) : "gasoline",
    transmission: TRANSMISSION_TYPES.includes(row.transmission) ? (row.transmission as TransmissionType) : "manual",
    city: (row.city as string) ?? "",
    description: (row.description as string) ?? "",
    images: ["image_1", "image_2", "image_3"].map((c) => row[c]).filter((v): v is string => typeof v === "string" && v !== ""),
    status: statusFromName(row.status),
    createdAt: parseDate(row.created_at),
    buyerId: textOrNull(row.buyer_id),
    buyerName: textOrNull(row.buyer_name),
    soldAt: row.sold_at == null ? null : parseDate(row.sold_at),
  };
}
