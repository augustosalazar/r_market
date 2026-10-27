import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

import { BottomSheet } from "@/src/core/components/BottomSheet";
import { ChoiceChips } from "@/src/core/components/ChoiceChips";
import { emptyFilter, ListingFilter } from "../../domain/entities/ListingFilter";

const numberOrNull = (text: string) => {
  const n = Number(text.replace(/[^0-9]/g, ""));
  return text.trim() && Number.isFinite(n) ? n : null;
};

type Props = {
  visible: boolean;
  initial: ListingFilter;
  brands: string[];
  onApply: (filter: ListingFilter) => void;
  onDismiss: () => void;
};

// Hoja de filtros del catálogo. `onApply` recibe el filtro nuevo.
export function FilterSheet(props: Props) {
  return (
    <BottomSheet visible={props.visible} onDismiss={props.onDismiss}>
      {/* Se monta al abrir: así arranca siempre con el filtro vigente. */}
      {props.visible ? <FilterForm {...props} /> : null}
    </BottomSheet>
  );
}

function FilterForm({ initial, brands, onApply }: Props) {
  const [brand, setBrand] = useState<string | null>(initial.brand);
  const [minPrice, setMinPrice] = useState(initial.minPrice?.toFixed(0) ?? "");
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice?.toFixed(0) ?? "");
  const [minYear, setMinYear] = useState(initial.minYear?.toString() ?? "");

  return (
    <>
      <Text variant="titleLarge" style={styles.title}>
        Filtrar
      </Text>
      <ChoiceChips
        options={[{ value: null as string | null, label: "Todas" }, ...brands.map((b) => ({ value: b as string | null, label: b }))]}
        selected={brand}
        onSelect={setBrand}
        compact
      />
      <View style={styles.row}>
        <TextInput style={styles.flex} mode="outlined" label="Precio desde" keyboardType="number-pad" value={minPrice} onChangeText={setMinPrice} />
        <TextInput style={styles.flex} mode="outlined" label="Precio hasta" keyboardType="number-pad" value={maxPrice} onChangeText={setMaxPrice} />
      </View>
      <TextInput mode="outlined" label="Año desde" keyboardType="number-pad" value={minYear} onChangeText={setMinYear} />
      <View style={[styles.row, styles.actions]}>
        <Button style={styles.flex} mode="outlined" onPress={() => onApply({ ...emptyFilter })}>
          Limpiar
        </Button>
        <Button
          style={styles.flex}
          mode="contained"
          onPress={() =>
            onApply({
              query: initial.query,
              brand,
              minPrice: numberOrNull(minPrice),
              maxPrice: numberOrNull(maxPrice),
              minYear: numberOrNull(minYear),
            })
          }
        >
          Aplicar
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 16 },
  row: { flexDirection: "row", gap: 12, marginVertical: 12 },
  flex: { flex: 1 },
  actions: { marginTop: 20 },
});
