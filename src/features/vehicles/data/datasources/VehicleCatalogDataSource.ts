import { Row } from "@/src/core/roble/guard";

export interface VehicleCatalogDataSource {
  readBrands(): Promise<Row[]>;
  readModels(brandId: string): Promise<Row[]>;
}
