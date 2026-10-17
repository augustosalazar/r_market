import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { ListingStatus, statusLabel } from "../../domain/entities/CarListing";

// El estado de una publicación, con el color que le corresponde.
export function StatusChip({ status }: { status: ListingStatus }) {
  const { colors } = useTheme();
  const [background, foreground] = {
    available: [colors.primaryContainer, colors.onPrimaryContainer],
    reserved: [colors.tertiaryContainer, colors.onTertiaryContainer],
    sold: [colors.surfaceVariant, colors.onSurfaceVariant],
    withdrawn: [colors.errorContainer, colors.onErrorContainer],
  }[status];
  return (
    <View style={[styles.chip, { backgroundColor: background }]}>
      <Text variant="labelSmall" style={{ color: foreground, fontWeight: "600" }}>
        {statusLabel[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: "flex-start" },
});
