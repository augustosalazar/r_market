import { useCallback } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { messageOf } from "@/src/core/utils/formatters";
import { useAsyncData } from "@/src/core/utils/useAsyncData";
import { useSession } from "@/src/features/auth/presentation/context/SessionContext";
import { ChatRepository } from "@/src/features/chat/domain/repositories/ChatRepository";
import { NotificationDispatcher } from "@/src/features/notifications/domain/repositories/NotificationRepository";
import { CarListing, ListingStatus, statusLabel } from "../../domain/entities/CarListing";
import { ListingRepository } from "../../domain/repositories/ListingRepository";
import { useFollows } from "../context/FollowsContext";
import { notifyStatusChange } from "../listingNotices";

// Lo mío: lo que vendo y lo que sigo (que es lo que me genera avisos).
export function useMyListingsViewModel() {
  const listings = useInject<ListingRepository>(TOKENS.ListingRepo);
  const chats = useInject<ChatRepository>(TOKENS.ChatRepo);
  const dispatcher = useInject<NotificationDispatcher>(TOKENS.NotificationDispatcher);
  const userId = useSession().user?.userId ?? null;
  const followIds = useFollows().ids;
  const snackbar = useSnackbar();

  const fetchSelling = useCallback(async () => (userId ? listings.bySeller(userId) : []), [listings, userId]);
  const sellingData = useAsyncData<CarListing[]>(fetchSelling, []);
  const setSelling = sellingData.setData;

  // La estrella se marca en el catálogo y en el detalle: la lista de seguidas se
  // vuelve a pedir cada vez que cambia el conjunto compartido.
  const fetchFollowing = useCallback(
    async () => (userId && followIds.size > 0 ? listings.followedBy(userId) : []),
    [listings, userId, followIds],
  );
  const followingData = useAsyncData<CarListing[]>(fetchFollowing, []);

  const selling = userId ? sellingData.data : [];
  const following = userId ? followingData.data : [];
  const loading = sellingData.loading;

  const replace = (updated: CarListing) => setSelling((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));

  const changeStatus = async (listing: CarListing, status: ListingStatus) => {
    try {
      const updated = await listings.changeStatus(listing.id, status);
      replace(updated);
      await notifyStatusChange({ listings, dispatcher }, updated, status);
      snackbar(`Estado actualizado a ${statusLabel[status].toLowerCase()}.`);
    } catch (e) {
      snackbar(messageOf(e), { error: true });
    }
  };

  const markSold = async (listing: CarListing, buyerId: string, buyerName: string) => {
    try {
      const updated = await listings.markSold(listing.id, buyerId, buyerName);
      replace(updated);
      await notifyStatusChange({ listings, dispatcher }, updated, "sold");
      snackbar(`Venta registrada con ${buyerName}.`);
    } catch (e) {
      snackbar(messageOf(e), { error: true });
    }
  };

  // A quién se le pudo haber vendido: quienes abrieron chat sobre ella.
  const buyerCandidates = useCallback(
    async (listing: CarListing) =>
      (await chats.threadsOfListing(listing.id)).filter((t) => t.buyerId !== listing.sellerId),
    [chats],
  );

  return { selling, following, loading, refresh: sellingData.reload, changeStatus, markSold, buyerCandidates };
}
