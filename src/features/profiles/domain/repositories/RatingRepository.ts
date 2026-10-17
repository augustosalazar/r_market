import { RatedRole, UserRating } from "../entities/UserRating";

// Las calificaciones entre las dos partes de una venta.
export interface RatingRepository {
  // Las que ha recibido esa persona, de la más reciente a la más antigua.
  receivedBy(userId: string): Promise<UserRating[]>;
  // Falla si ya existe una de esa persona para esa venta.
  rate(params: {
    listingId: string;
    raterId: string;
    raterName: string;
    ratedId: string;
    ratedRole: RatedRole;
    stars: number;
    comment: string;
  }): Promise<UserRating>;
}
