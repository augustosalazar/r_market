import { DummyData } from "@/src/core/data/dummyData";
import { VehicleCatalogDataSource } from "./VehicleCatalogDataSource";

export class VehicleCatalogInMemoryDataSource implements VehicleCatalogDataSource {
  constructor(private readonly data: DummyData) {}

  async readBrands() {
    await this.data.delay(0.7);
    return [...this.data.brands];
  }

  async readModels(brandId: string) {
    await this.data.delay(0.7);
    return this.data.models.filter((r) => r.brand_id === brandId);
  }
}
