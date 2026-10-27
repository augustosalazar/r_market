import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Chip } from "react-native-paper";

import { CarBrand } from "@/src/features/vehicles/domain/entities/Vehicle";

// La tira horizontal de marcas del catálogo: un filtro de un toque. Lo demás
// —precio, año— sigue en la hoja de filtros, porque son rangos.
export function BrandStrip({
  brands,
  selected,
  onSelected,
}: {
  brands: CarBrand[];
  // El nombre de la marca elegida, o `null` para «Todas».
  selected: string | null;
  onSelected: (brand: string | null) => void;
}) {
  if (brands.length === 0) return null;
  const chip = (brand: string | null, label: string) => (
    <Chip
      key={label}
      testID={BrandStrip.chipKey(brand)}
      mode="outlined"
      selected={selected === brand}
      showSelectedOverlay
      // Volver a tocar la marca elegida la quita.
      onPress={() => onSelected(selected === brand ? null : brand)}
      accessibilityLabel={label}
    >
      {label}
    </Chip>
  );
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
      {/* La primera es «Todas», que es como se quita el filtro sin ir a la hoja. */}
      {chip(null, "Todas")}
      {brands.map((b) => chip(b.name, b.name))}
    </ScrollView>
  );
}

// El chip de una marca; `null` es «Todas».
BrandStrip.chipKey = (brand: string | null) => `brandStrip.${brand ?? "all"}`;

const styles = StyleSheet.create({
  strip: { paddingHorizontal: 16, gap: 8 },
});
