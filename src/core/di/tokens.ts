// One token per dependency registered in the container (see appContainer.ts).
export const TOKENS = {
  RobleClient: Symbol("RobleClient"),
  AuthRepo: Symbol("AuthRepo"),
  ListingRepo: Symbol("ListingRepo"),
  VehicleRepo: Symbol("VehicleRepo"),
  QaRepo: Symbol("QaRepo"),
  ChatRepo: Symbol("ChatRepo"),
  RatingRepo: Symbol("RatingRepo"),
  NotificationRepo: Symbol("NotificationRepo"),
  NotificationDispatcher: Symbol("NotificationDispatcher"),
} as const;
