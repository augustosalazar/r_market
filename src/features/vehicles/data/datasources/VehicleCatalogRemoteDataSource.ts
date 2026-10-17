import { RobleClient } from "@/src/core/roble/RobleClient";
import { VehicleCatalogDataSource } from "./VehicleCatalogDataSource";

// Las dos tablas son públicas: la tira de marcas se pinta sin sesión.
export class VehicleCatalogRemoteDataSource implements VehicleCatalogDataSource {
  constructor(private readonly client: RobleClient) {}

  readBrands() {
    return this.client.readPublicOrPrivate(RobleClient.brands);
  }

  readModels(brandId: string) {
    return this.client.readPublicOrPrivate(RobleClient.models, { brand_id: brandId });
  }
}
