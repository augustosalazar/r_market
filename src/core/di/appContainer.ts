import { AuthRemoteDataSource } from "@/src/features/auth/data/datasources/AuthRemoteDataSource";
import { AuthRepositoryImpl } from "@/src/features/auth/data/repositories/AuthRepositoryImpl";
import { ChatRemoteDataSource } from "@/src/features/chat/data/datasources/ChatRemoteDataSource";
import { ChatRepositoryImpl } from "@/src/features/chat/data/repositories/ChatRepositoryImpl";
import { ListingRemoteDataSource } from "@/src/features/listings/data/datasources/ListingRemoteDataSource";
import { ListingRepositoryImpl } from "@/src/features/listings/data/repositories/ListingRepositoryImpl";
import { NotificationRemoteDataSource } from "@/src/features/notifications/data/datasources/NotificationRemoteDataSource";
import { NotificationRepositoryImpl } from "@/src/features/notifications/data/repositories/NotificationRepositoryImpl";
import { RatingRemoteDataSource } from "@/src/features/profiles/data/datasources/RatingRemoteDataSource";
import { RatingRepositoryImpl } from "@/src/features/profiles/data/repositories/RatingRepositoryImpl";
import { QaRemoteDataSource } from "@/src/features/qa/data/datasources/QaRemoteDataSource";
import { QaRepositoryImpl } from "@/src/features/qa/data/repositories/QaRepositoryImpl";
import { VehicleCatalogRemoteDataSource } from "@/src/features/vehicles/data/datasources/VehicleCatalogRemoteDataSource";
import { VehicleCatalogRepositoryImpl } from "@/src/features/vehicles/data/repositories/VehicleCatalogRepositoryImpl";
import { robleConfig } from "../roble/robleConfig";
import { RobleClient } from "../roble/RobleClient";
import { Container } from "./container";
import { TOKENS } from "./tokens";

// Composition root: the only place that knows which implementation backs each interface.
// What is chosen here is the data source; there is one repository per feature.
export function createAppContainer(): Container {
  const c = new Container();

  // Un solo cliente para toda la app: uno por pantalla daría a cada copia su propia sesión.
  const client = new RobleClient(robleConfig);
  const notifications = new NotificationRepositoryImpl(new NotificationRemoteDataSource(client));

  return c
    .register(TOKENS.RobleClient, client)
    .register(TOKENS.AuthRepo, new AuthRepositoryImpl(new AuthRemoteDataSource(client)))
    .register(TOKENS.ListingRepo, new ListingRepositoryImpl(new ListingRemoteDataSource(client)))
    .register(TOKENS.VehicleRepo, new VehicleCatalogRepositoryImpl(new VehicleCatalogRemoteDataSource(client)))
    .register(TOKENS.QaRepo, new QaRepositoryImpl(new QaRemoteDataSource(client)))
    .register(TOKENS.ChatRepo, new ChatRepositoryImpl(new ChatRemoteDataSource(client)))
    .register(TOKENS.RatingRepo, new RatingRepositoryImpl(new RatingRemoteDataSource(client)))
    .register(TOKENS.NotificationRepo, notifications)
    .register(TOKENS.NotificationDispatcher, notifications);
}
