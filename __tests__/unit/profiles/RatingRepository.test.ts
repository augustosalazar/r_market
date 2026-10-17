import { Row } from "@/src/core/roble/guard";
import { RatingRepositoryImpl } from "@/src/features/profiles/data/repositories/RatingRepositoryImpl";

const base = { listingId: "l1", raterId: "buyer", raterName: "Beto", ratedId: "seller", ratedRole: "seller" as const, comment: "" };

describe("RatingRepositoryImpl", () => {
  it("allows one rating per sale and per side", async () => {
    const rows: Row[] = [];
    const repo = new RatingRepositoryImpl({
      readRatings: async (f) => rows.filter((r) => Object.entries(f).every(([k, v]) => r[k] === v)),
      createRating: async (row) => {
        const created = { ...row, _id: `r${rows.length}` };
        rows.push(created);
        return created;
      },
    });
    await repo.rate({ ...base, stars: 5 });
    await expect(repo.rate({ ...base, stars: 4 })).rejects.toThrow("Ya calificaste esta venta.");
    expect(await repo.receivedBy("seller")).toHaveLength(1);
  });

  it("rejects out-of-range stars and self-ratings before touching the server", async () => {
    const createRating = jest.fn();
    const repo = new RatingRepositoryImpl({ readRatings: async () => [], createRating });
    await expect(repo.rate({ ...base, stars: 6 })).rejects.toThrow("1 a 5");
    await expect(repo.rate({ ...base, ratedId: "buyer", stars: 5 })).rejects.toThrow("ti mismo");
    expect(createRating).not.toHaveBeenCalled();
  });
});
