import { useEffect, useRef, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { messageOf } from "@/src/core/utils/formatters";
import { CarBrand } from "@/src/features/vehicles/domain/entities/Vehicle";
import { VehicleCatalogRepository } from "@/src/features/vehicles/domain/repositories/VehicleCatalogRepository";
import { CarListing } from "../../domain/entities/CarListing";
import { emptyFilter, ListingFilter } from "../../domain/entities/ListingFilter";
import { ListingRepository } from "../../domain/repositories/ListingRepository";
import { useFollows } from "../context/FollowsContext";

// El catálogo público. No exige sesión; solo la usa (vía FollowsContext) para
// saber qué publicaciones marcar como seguidas.
//
// Secuencia: la pantalla llama a una acción de aquí (search, selectBrand…) →
// la acción le pide los datos al repositorio → el repositorio a la fuente de
// datos → el resultado se guarda en el estado → la pantalla se vuelve a dibujar.
export function useCatalogViewModel() {
  const listingsRepo = useInject<ListingRepository>(TOKENS.ListingRepo);
  const vehicles = useInject<VehicleCatalogRepository>(TOKENS.VehicleRepo);
  const follows = useFollows();

  // ── Estado que lee la pantalla ────────────────────────────
  const [listings, setListings] = useState<CarListing[]>([]);
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [filter, setFilter] = useState<ListingFilter>(emptyFilter);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // El filtro más reciente, para la búsqueda retrasada: el `filter` del estado
  // que vio el temporizador puede ser ya viejo cuando se dispare.
  const currentFilter = useRef<ListingFilter>(emptyFilter);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Número de turno de la última búsqueda (no es un historial): si se cruzan dos
  // respuestas, solo vale la del turno más reciente.
  const searchTicket = useRef(0);

  // ── Cargas: aquí se llama al repositorio ──────────────────

  const fetchListings = async (f: ListingFilter) => {
    const id = ++searchTicket.current;
    try {
      const result = await listingsRepo.search(f);
      if (id !== searchTicket.current) return;
      setListings(result);
      setError(null);
    } catch (e) {
      if (id === searchTicket.current) setError(messageOf(e));
    } finally {
      if (id === searchTicket.current) setLoading(false);
    }
  };

  // Las marcas salen del catálogo precargado, no de lo que haya publicado, y no
  // cambian entre búsquedas: se piden una vez.
  const fetchBrands = async () => {
    try {
      const result = await vehicles.brands();
      setBrands(result);
    } catch (e) {
      setError(messageOf(e));
    }
  };

  // Al abrir la pantalla: la primera búsqueda y las marcas.
  // (La regla de abajo no ve que el estado cambia después del `await`, no al
  // instante; por eso se desactiva aquí.)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchListings(emptyFilter);
    fetchBrands();
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Acciones que llama la pantalla ────────────────────────

  // Una búsqueda nueva: guarda el filtro y vuelve a pedir.
  const search = (next: ListingFilter) => {
    currentFilter.current = next;
    setFilter(next);
    setLoading(true);
    fetchListings(next);
  };

  // La búsqueda se retrasa: escribir no dispara una consulta por tecla.
  const onQueryChanged = (query: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search({ ...currentFilter.current, query }), 350);
  };

  // La marca elegida en la tira; `null` es «Todas».
  const selectBrand = (brand: string | null) => {
    if (filter.brand !== brand) search({ ...currentFilter.current, brand });
  };

  return {
    listings,
    brands,
    filter,
    loading,
    error,
    followed: follows.ids,
    refresh: () => search(currentFilter.current),
    onQueryChanged,
    selectBrand,
    applyFilter: search,
    clearFilter: () => search({ ...emptyFilter }),
    toggleFollow: (listingId: string) => follows.toggle(listingId),
  };
}
