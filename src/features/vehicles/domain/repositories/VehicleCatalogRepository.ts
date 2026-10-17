import { CarBrand, CarModel } from "../entities/Vehicle";

// El catálogo precargado de marcas y modelos. Solo lectura, y sin sesión.
export interface VehicleCatalogRepository {
  brands(): Promise<CarBrand[]>;
  modelsOf(brandId: string): Promise<CarModel[]>;
}
