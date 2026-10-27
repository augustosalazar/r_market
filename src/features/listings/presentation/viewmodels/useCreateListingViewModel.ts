import { useEffect, useState } from "react";

import { useInject } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { useSession } from "@/src/features/auth/presentation/context/SessionContext";
import { CarBrand, CarModel } from "@/src/features/vehicles/domain/entities/Vehicle";
import { VehicleCatalogRepository } from "@/src/features/vehicles/domain/repositories/VehicleCatalogRepository";
import { CarListing, FuelType, TransmissionType } from "../../domain/entities/CarListing";
import { ListingRepository } from "../../domain/repositories/ListingRepository";

// El formulario de publicación: guarda lo que se escribe y valida antes de
// mandarlo al repositorio, para que la pantalla sea solo campos.
//
// Secuencia: al abrir, se piden las marcas al repositorio → elegir una marca
// pide sus modelos → `submit` valida y le entrega la publicación al repositorio.
export function useCreateListingViewModel() {
  const listings = useInject<ListingRepository>(TOKENS.ListingRepo);
  const vehicles = useInject<VehicleCatalogRepository>(TOKENS.VehicleRepo);
  const session = useSession();

  // ── Estado que lee la pantalla ────────────────────────────
  // Marca y modelo se eligen del catálogo precargado, no se escriben.
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [brand, setBrand] = useState<CarBrand | null>(null);
  const [model, setModel] = useState<CarModel | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [form, setForm] = useState({ year: "", price: "", mileage: "", city: "", description: "" });
  const [fuel, setFuel] = useState<FuelType>("gasoline");
  const [transmission, setTransmission] = useState<TransmissionType>("manual");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Cargas: aquí se llama al repositorio ──────────────────

  const fetchBrands = async () => {
    try {
      const result = await vehicles.brands();
      setBrands(result);
    } catch {
      setError("No se pudo cargar el catálogo de marcas.");
    } finally {
      setLoadingCatalog(false);
    }
  };

  // Al abrir la pantalla: las marcas.
  // (La regla de abajo no ve que el estado cambia después del `await`, no al
  // instante; por eso se desactiva aquí.)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Acciones que llama la pantalla ────────────────────────

  // Cambiar de marca vacía el modelo: dejarlo puesto permitiría un «Renault Picanto».
  const selectBrand = async (selected: CarBrand) => {
    setBrand(selected);
    setModel(null);
    setModels([]);
    setLoadingCatalog(true);
    try {
      const result = await vehicles.modelsOf(selected.id);
      setModels(result);
    } catch {
      setError("No se pudieron cargar los modelos de esa marca.");
    } finally {
      setLoadingCatalog(false);
    }
  };

  const setField = (field: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [field]: value }));

  // Devuelve la publicación creada, o `null` si la validación falló.
  const submit = async (): Promise<CarListing | null> => {
    setError(null);
    const year = parseInt(form.year.trim(), 10) || 0;
    const price = Number(form.price.replace(/[^0-9.]/g, "")) || 0;
    const mileage = parseInt(form.mileage.replace(/[^0-9]/g, ""), 10) || 0;
    const currentYear = new Date().getFullYear();
    const fail = (m: string) => {
      setError(m);
      return null;
    };

    if (!brand) return fail("Elige la marca.");
    if (!model) return fail("Elige el modelo.");
    if (year < 1900 || year > currentYear + 1) return fail(`El año debe estar entre 1900 y ${currentYear + 1}.`);
    if (price <= 0) return fail("El precio debe ser mayor que cero.");
    if (mileage < 0) return fail("El kilometraje no puede ser negativo.");
    const seller = session.currentUser();
    if (!seller || seller.isAnonymous) return fail("Necesitas una cuenta para publicar.");

    setSaving(true);
    try {
      return await listings.create({
        sellerId: seller.userId,
        sellerName: seller.name,
        brand: brand.name,
        model: model.name,
        year,
        price,
        mileageKm: mileage,
        fuel,
        transmission,
        city: form.city.trim(),
        description: form.description.trim(),
        // Sin almacenamiento conectado no hay dónde subir fotos.
        images: [],
        status: "available",
        createdAt: new Date(),
        buyerId: null,
        buyerName: null,
        soldAt: null,
      });
    } catch {
      return fail("No se pudo publicar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return {
    brands,
    models,
    brand,
    model,
    loadingCatalog,
    form,
    setField,
    fuel,
    setFuel,
    transmission,
    setTransmission,
    saving,
    error,
    selectBrand,
    selectModel: setModel,
    submit,
  };
}
