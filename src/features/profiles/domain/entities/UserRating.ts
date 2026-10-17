// El papel que jugaba la persona calificada en esa venta.
export type RatedRole = "seller" | "buyer";
export const ratedRoleLabel: Record<RatedRole, string> = { seller: "Como vendedor", buyer: "Como comprador" };

export const MIN_STARS = 1;
export const MAX_STARS = 5;

// Una calificación de una parte de la venta a la otra. **Inmutable**: una por
// venta y por parte, y no se edita ni se borra.
export type UserRating = {
  id: string;
  listingId: string;
  raterId: string;
  raterName: string;
  ratedId: string;
  ratedRole: RatedRole;
  stars: number;
  comment: string;
  createdAt: Date;
};
