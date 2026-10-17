import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, IconButton, Text, useTheme } from "react-native-paper";

import { CarPhoto } from "@/src/core/widgets/CarPhoto";
import { Formatters } from "@/src/core/utils/formatters";
import { CarListing, listingCover, listingTitle, transmissionLabel } from "../../domain/entities/CarListing";
import { StatusChip } from "./StatusChip";

// La tarjeta del catálogo: la unidad que se repite en todas las listas.
export function ListingCard({
  listing,
  onPress,
  isFollowed = false,
  onToggleFollow,
  footer,
  testID,
}: {
  testID?: string;
  listing: CarListing;
  onPress: () => void;
  isFollowed?: boolean;
  onToggleFollow?: () => void;
  footer?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const title = listingTitle(listing);
  return (
    <Card testID={testID} mode="outlined" style={styles.card} onPress={onPress} accessibilityLabel={title}>
      <View style={styles.photo}>
        <CarPhoto source={listingCover(listing)} seed={listing.id} />
        <View style={styles.status}>
          <StatusChip status={listing.status} />
        </View>
        {onToggleFollow ? (
          <IconButton
            testID={ListingCard.followButtonKey}
            mode="contained-tonal"
            icon={isFollowed ? "star" : "star-outline"}
            onPress={onToggleFollow}
            style={styles.follow}
            accessibilityLabel={isFollowed ? "Dejar de seguir" : "Seguir y recibir avisos"}
          />
        ) : null}
      </View>
      <Card.Content style={styles.content}>
        <Text variant="titleMedium" numberOfLines={1} style={styles.bold}>
          {title}
        </Text>
        <Text variant="titleLarge" style={{ color: colors.primary, fontWeight: "700" }}>
          {Formatters.price(listing.price)}
        </Text>
        <View style={styles.meta}>
          <Meta icon="speedometer" label={Formatters.mileage(listing.mileageKm)} />
          <Meta icon="cog-outline" label={transmissionLabel[listing.transmission]} />
          <Meta icon="map-marker-outline" label={listing.city} />
        </View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </Card.Content>
    </Card>
  );
}

// La estrella: hay una por tarjeta; para una concreta se busca dentro de ella.
ListingCard.followButtonKey = "listingCard.follow";

function Meta({ icon, label }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.metaItem}>
      <MaterialCommunityIcons name={icon} size={15} color={colors.onSurfaceVariant} />
      <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 6, overflow: "hidden" },
  photo: { aspectRatio: 16 / 9, borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: "hidden" },
  status: { position: "absolute", left: 12, top: 12 },
  follow: { position: "absolute", right: 0, top: 0 },
  content: { paddingTop: 12, gap: 4 },
  bold: { fontWeight: "600" },
  meta: { flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 4, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  footer: { marginTop: 10 },
});
