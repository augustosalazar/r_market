import { NotificationKind } from "@/src/features/notifications/domain/entities/AppNotification";
import { NotificationDispatcher } from "@/src/features/notifications/domain/repositories/NotificationRepository";
import { CarListing, ListingStatus, listingTitle, statusLabel } from "../domain/entities/CarListing";
import { ListingRepository } from "../domain/repositories/ListingRepository";

// A quién se le avisa de lo que pasa en una publicación: a sus seguidores, más
// quien corresponda según el caso, y nunca a quien provocó el evento.
//
// En f_market esta regla estaba copiada en dos view models (detalle y «Lo mío»);
// aquí vive una vez y la usan los dos.
export async function notifyListing(
  deps: { listings: ListingRepository; dispatcher: NotificationDispatcher },
  p: {
    listing: CarListing;
    kind: NotificationKind;
    body: string;
    exclude: string[];
    includeSeller: boolean;
    extra?: string[];
  },
) {
  const targets = new Set([...(await deps.listings.followerIdsOf(p.listing.id)), ...(p.extra ?? [])]);
  if (p.includeSeller) targets.add(p.listing.sellerId);
  p.exclude.forEach((id) => targets.delete(id));
  if (targets.size === 0) return;
  await deps.dispatcher.dispatch({
    userIds: [...targets],
    kind: p.kind,
    title: listingTitle(p.listing),
    body: p.body,
    listingId: p.listing.id,
  });
}

// Cambiar el estado (incluido venderla) avisa a quienes la siguen (requisito 6).
export function notifyStatusChange(
  deps: { listings: ListingRepository; dispatcher: NotificationDispatcher },
  updated: CarListing,
  status: ListingStatus,
) {
  return notifyListing(deps, {
    listing: updated,
    kind: "statusChange",
    body: `La publicación ahora está ${statusLabel[status].toLowerCase()}.`,
    exclude: [updated.sellerId],
    includeSeller: false,
  });
}
