import { guardRoble, parseDate, Row, toNumber } from "@/src/core/roble/guard";
import { MAX_STARS, MIN_STARS, RatedRole, UserRating } from "../../domain/entities/UserRating";
import { ProfileFailure } from "../../domain/ProfileFailure";
import { RatingRepository } from "../../domain/repositories/RatingRepository";
import { RatingDataSource } from "../datasources/RatingDataSource";

const failure = (m: string) => new ProfileFailure(m);

// Lo que decide: que no haya dos de la misma persona por la misma venta —el
// servidor no tiene unicidad por par de columnas— y que las estrellas estén en rango.
export class RatingRepositoryImpl implements RatingRepository {
  constructor(private readonly source: RatingDataSource) {}

  async receivedBy(userId: string) {
    const rows = await guardRoble(() => this.source.readRatings({ rated_id: userId }), failure);
    return rows.map(toRating).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async rate(p: {
    listingId: string;
    raterId: string;
    raterName: string;
    ratedId: string;
    ratedRole: RatedRole;
    stars: number;
    comment: string;
  }) {
    if (p.stars < MIN_STARS || p.stars > MAX_STARS) throw new ProfileFailure("La calificación va de 1 a 5 estrellas.");
    if (p.raterId === p.ratedId) throw new ProfileFailure("No puedes calificarte a ti mismo.");

    const existing = await guardRoble(
      () => this.source.readRatings({ listing_id: p.listingId, rater_id: p.raterId }),
      failure,
    );
    if (existing.length > 0) throw new ProfileFailure("Ya calificaste esta venta.");

    const row = await guardRoble(
      () =>
        this.source.createRating({
          listing_id: p.listingId,
          rater_id: p.raterId,
          rater_name: p.raterName,
          rated_id: p.ratedId,
          rated_role: p.ratedRole,
          stars: p.stars,
          comment: p.comment,
          created_at: new Date().toISOString(),
        }),
      failure,
    );
    return toRating(row);
  }
}

function toRating(row: Row): UserRating {
  return {
    id: String(row._id),
    listingId: String(row.listing_id),
    raterId: String(row.rater_id),
    raterName: (row.rater_name as string) || "Alguien",
    ratedId: String(row.rated_id),
    ratedRole: row.rated_role === "buyer" ? "buyer" : "seller",
    stars: toNumber(row.stars),
    comment: (row.comment as string) ?? "",
    createdAt: parseDate(row.created_at),
  };
}
