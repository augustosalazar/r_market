import { CarListing, ListingStatus } from "../entities/CarListing";
import { ListingFilter } from "../entities/ListingFilter";

// El catálogo. `search` es público a propósito: el catálogo se ve sin sesión.
export interface ListingRepository {
  search(filter: ListingFilter): Promise<CarListing[]>;
  byId(id: string): Promise<CarListing | null>;
  bySeller(sellerId: string): Promise<CarListing[]>;
  create(listing: Omit<CarListing, "id">): Promise<CarListing>;
  changeStatus(listingId: string, status: ListingStatus): Promise<CarListing>;
  // Cierra la venta dejando constancia de quién compró.
  markSold(listingId: string, buyerId: string, buyerName: string): Promise<CarListing>;
  // Lo que `userId` ha comprado, de lo más reciente a lo más antiguo.
  purchasesOf(userId: string): Promise<CarListing[]>;
  // Publicaciones que `userId` sigue, y por las que recibe avisos.
  followedBy(userId: string): Promise<CarListing[]>;
  followedIds(userId: string): Promise<Set<string>>;
  // Devuelve si quedó siguiendo.
  toggleFollow(listingId: string, userId: string): Promise<boolean>;
  // A quiénes hay que avisarles de lo que pase en la publicación.
  followerIdsOf(listingId: string): Promise<string[]>;
}
