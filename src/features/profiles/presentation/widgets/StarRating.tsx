import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { View } from "react-native";
import { IconButton, useTheme } from "react-native-paper";

import { MAX_STARS, MIN_STARS } from "../../domain/entities/UserRating";

// Estrellas de solo lectura, con media estrella: hace legible un 4.3.
export function StarRating({ stars, size = 18 }: { stars: number; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row" }} accessibilityLabel={`${stars.toFixed(1)} de ${MAX_STARS} estrellas`}>
      {Array.from({ length: MAX_STARS }, (_, k) => k + 1).map((i) => (
        <MaterialCommunityIcons
          key={i}
          size={size}
          color={colors.tertiary}
          name={stars >= i ? "star" : stars >= i - 0.5 ? "star-half-full" : "star-outline"}
        />
      ))}
    </View>
  );
}

// Estrellas que se tocan, para el formulario de calificación.
export function StarPicker({ stars, onChange }: { stars: number; onChange: (value: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "center" }}>
      {Array.from({ length: MAX_STARS - MIN_STARS + 1 }, (_, k) => k + MIN_STARS).map((i) => (
        <IconButton
          key={i}
          icon={stars >= i ? "star" : "star-outline"}
          iconColor={colors.tertiary}
          size={32}
          onPress={() => onChange(i)}
          accessibilityLabel={`${i} estrellas`}
        />
      ))}
    </View>
  );
}
