import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Chip } from "react-native-paper";

type Option<T> = { value: T; label: string };

// Una fila de chips de los que se elige uno. `scroll` la vuelve una tira
// horizontal (la de marcas del catálogo); si no, se envuelve en varias líneas.
export function ChoiceChips<T>({
  options,
  selected,
  onSelect,
  scroll = false,
  compact = false,
}: {
  options: Option<T>[];
  selected: T;
  onSelect: (value: T) => void;
  scroll?: boolean;
  compact?: boolean;
}) {
  const chips = options.map((o) => (
    <Chip
      key={String(o.label)}
      mode="outlined"
      compact={compact}
      selected={o.value === selected}
      showSelectedOverlay
      onPress={() => onSelect(o.value)}
      style={styles.chip}
      accessibilityLabel={o.label}
    >
      {o.label}
    </Chip>
  ));
  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {chips}
      </ScrollView>
    );
  }
  return <View style={styles.wrap}>{chips}</View>;
}

const styles = StyleSheet.create({
  strip: { paddingHorizontal: 16, gap: 8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {},
});
