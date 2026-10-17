import { guardRoble, Row, toNumber } from "@/src/core/roble/guard";
import { CarBrand, CarModel } from "../../domain/entities/Vehicle";
import { VehicleCatalogRepository } from "../../domain/repositories/VehicleCatalogRepository";
import { VehicleFailure } from "../../domain/VehicleFailure";
import { VehicleCatalogDataSource } from "../datasources/VehicleCatalogDataSource";

// Lo que decide: las filas inactivas no se muestran, y el orden lo manda
// `sort_order`, con el nombre para desempatar.
export class VehicleCatalogRepositoryImpl implements VehicleCatalogRepository {
  constructor(private readonly source: VehicleCatalogDataSource) {}

  async brands(): Promise<CarBrand[]> {
    const rows = await guardRoble(() => this.source.readBrands(), (m) => new VehicleFailure(m));
    return rows
      .filter(isActive)
      .map((r) => ({ id: String(r._id), name: String(r.name), sortOrder: toNumber(r.sort_order) }))
      .sort(byOrderThenName);
  }

  async modelsOf(brandId: string): Promise<CarModel[]> {
    const rows = await guardRoble(() => this.source.readModels(brandId), (m) => new VehicleFailure(m));
    return rows
      .filter(isActive)
      .map((r) => ({
        id: String(r._id),
        brandId: String(r.brand_id),
        name: String(r.name),
        sortOrder: toNumber(r.sort_order),
      }))
      .sort(byOrderThenName);
  }
}

// `active` nulo cuenta como activo: una fila sembrada sin la bandera no
// debería desaparecer del formulario.
const isActive = (row: Row) => row.active !== false;

const byOrderThenName = (a: { sortOrder: number; name: string }, b: { sortOrder: number; name: string }) =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
