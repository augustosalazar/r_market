import { useCallback, useEffect, useRef, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { useAsyncData } from "@/src/core/utils/useAsyncData";
import { CarBrand } from "@/src/features/vehicles/domain/entities/Vehicle";
import { VehicleCatalogRepository } from "@/src/features/vehicles/domain/repositories/VehicleCatalogRepository";
import { CarListing } from "../../domain/entities/CarListing";
import { emptyFilter, ListingFilter } from "../../domain/entities/ListingFilter";
import { ListingRepository } from "../../domain/repositories/ListingRepository";
import { useFollows } from "../context/FollowsContext";

// El catálogo público. No exige sesión; solo la usa (vía FollowsContext) para
// saber qué publicaciones marcar como seguidas.
export function useCatalogViewModel() {
  const listingsRepo = useInject<ListingRepository>(TOKENS.ListingRepo);
  const vehicles = useInject<VehicleCatalogRepository>(TOKENS.VehicleRepo);
  const follows = useFollows();

  const [filter, setFilter] = useState<ListingFilter>(emptyFilter);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cada filtro nuevo es una búsqueda nueva.
  const search = useCallback(() => listingsRepo.search(filter), [listingsRepo, filter]);
  const { data: listings, loading, error, reload } = useAsyncData<CarListing[]>(search, []);

  // Las marcas salen del catálogo precargado, no de lo que haya publicado, y no
  // cambian entre búsquedas: se piden una vez.
  const fetchBrands = useCallback(() => vehicles.brands(), [vehicles]);
  const { data: brands } = useAsyncData<CarBrand[]>(fetchBrands, []);

  useEffect(() => () => {
    if (debounce.current) clearTimeout(debounce.current);
  }, []);

  // La búsqueda se retrasa: escribir no dispara una consulta por tecla.
  const onQueryChanged = useCallback((query: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setFilter((f) => ({ ...f, query })), 350);
  }, []);

  return {
    listings,
    brands,
    filter,
    loading,
    error,
    followed: follows.ids,
    refresh: reload,
    onQueryChanged,
    // La marca elegida en la tira; `null` es «Todas».
    selectBrand: (brand: string | null) => setFilter((f) => (f.brand === brand ? f : { ...f, brand })),
    applyFilter: (next: ListingFilter) => setFilter(next),
    clearFilter: () => setFilter({ ...emptyFilter }),
    toggleFollow: (listingId: string) => follows.toggle(listingId),
  };
}
