import { AuthInMemoryDataSource } from "@/src/features/auth/data/datasources/AuthInMemoryDataSource";
import { AuthRepositoryImpl } from "@/src/features/auth/data/repositories/AuthRepositoryImpl";
import { ChatInMemoryDataSource } from "@/src/features/chat/data/datasources/ChatInMemoryDataSource";
import { ChatRepositoryImpl } from "@/src/features/chat/data/repositories/ChatRepositoryImpl";
import { ListingInMemoryDataSource } from "@/src/features/listings/data/datasources/ListingInMemoryDataSource";
import { ListingRepositoryImpl } from "@/src/features/listings/data/repositories/ListingRepositoryImpl";
import { NotificationInMemoryDataSource } from "@/src/features/notifications/data/datasources/NotificationInMemoryDataSource";
import { NotificationRepositoryImpl } from "@/src/features/notifications/data/repositories/NotificationRepositoryImpl";
import { RatingInMemoryDataSource } from "@/src/features/profiles/data/datasources/RatingInMemoryDataSource";
import { RatingRepositoryImpl } from "@/src/features/profiles/data/repositories/RatingRepositoryImpl";
import { QaInMemoryDataSource } from "@/src/features/qa/data/datasources/QaInMemoryDataSource";
import { QaRepositoryImpl } from "@/src/features/qa/data/repositories/QaRepositoryImpl";
import { VehicleCatalogInMemoryDataSource } from "@/src/features/vehicles/data/datasources/VehicleCatalogInMemoryDataSource";
import { VehicleCatalogRepositoryImpl } from "@/src/features/vehicles/data/repositories/VehicleCatalogRepositoryImpl";
import { DummyData } from "../data/dummyData";
import { Container } from "./container";
import { TOKENS } from "./tokens";

// Los mismos repositorios, con los datasources de memoria (el `LocalBindings`
// de f_market). Es lo que usa la prueba de integración y sirve para trabajar en
// la UI sin servidor (`EXPO_PUBLIC_DATA_SOURCE=local`). Que solo cambie el
// datasource es la prueba de que la separación vale.
export function createLocalContainer(data: DummyData = new DummyData()): Container {
  const notifications = new NotificationRepositoryImpl(new NotificationInMemoryDataSource(data));
  return new Container()
    .register(TOKENS.AuthRepo, new AuthRepositoryImpl(new AuthInMemoryDataSource(data)))
    .register(TOKENS.ListingRepo, new ListingRepositoryImpl(new ListingInMemoryDataSource(data)))
    .register(TOKENS.VehicleRepo, new VehicleCatalogRepositoryImpl(new VehicleCatalogInMemoryDataSource(data)))
    .register(TOKENS.QaRepo, new QaRepositoryImpl(new QaInMemoryDataSource(data)))
    .register(TOKENS.ChatRepo, new ChatRepositoryImpl(new ChatInMemoryDataSource(data)))
    .register(TOKENS.RatingRepo, new RatingRepositoryImpl(new RatingInMemoryDataSource(data)))
    .register(TOKENS.NotificationRepo, notifications)
    .register(TOKENS.NotificationDispatcher, notifications);
}
