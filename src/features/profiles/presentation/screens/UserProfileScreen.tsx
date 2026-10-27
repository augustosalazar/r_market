import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useLayoutEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Avatar, Button, Card, List, Text } from "react-native-paper";

import { Formatters, initialsOf } from "@/src/core/utils/formatters";
import { CarListing, listingTitle } from "@/src/features/listings/domain/entities/CarListing";
import { ListingCard } from "@/src/features/listings/presentation/components/ListingCard";
import { RootStackParamList } from "@/src/navigation/types";
import { ratedRoleLabel } from "../../domain/entities/UserRating";
import { PendingRating, useUserProfileViewModel } from "../viewmodels/useUserProfileViewModel";
import { RateSheet } from "../components/RateSheet";
import { StarRating } from "../components/StarRating";

type Props = NativeStackScreenProps<RootStackParamList, "UserProfile">;

// El perfil público de una persona. No exige sesión: quien mira un carro
// necesita poder juzgar a quien se lo vende antes de crear cuenta.
export default function UserProfileScreen({ route, navigation }: Props) {
  const { userId, name } = route.params;
  const vm = useUserProfileViewModel(userId);
  const [rating, setRating] = useState<PendingRating | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: name });
  }, [navigation, name]);

  if (vm.loading && vm.received.length === 0 && vm.selling.length === 0) return <ActivityIndicator style={styles.loader} />;

  const section = (title: string, items: CarListing[], empty: string) => (
    <View style={styles.section}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        {title}
      </Text>
      {items.length === 0 ? (
        <Text variant="bodySmall" style={styles.emptyText}>{empty}</Text>
      ) : (
        items.map((l) => (
          <ListingCard key={l.id} listing={l} onPress={() => navigation.push("ListingDetail", { listingId: l.id })} />
        ))
      )}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={vm.refresh} />}>
      <View style={styles.header}>
        <Avatar.Text size={72} label={initialsOf(name)} />
        <Text variant="titleLarge">{name}</Text>
        {vm.average == null ? (
          <Text variant="bodySmall">Sin calificaciones todavía</Text>
        ) : (
          <View style={styles.row}>
            <StarRating stars={vm.average} />
            <Text variant="bodySmall">
              {vm.average.toFixed(1)} · {vm.received.length} {vm.received.length === 1 ? "calificación" : "calificaciones"}
            </Text>
          </View>
        )}
        <View style={styles.stats}>
          <Stat value={vm.sold.length} label="vendidos" />
          <Stat value={vm.bought.length} label="comprados" />
          <Stat value={vm.selling.length} label="en venta" />
        </View>
      </View>

      {/* Lo único de esta pantalla que le pide algo a quien mira: va arriba. */}
      {vm.pending.length > 0 ? (
        <Card mode="outlined" style={styles.pending}>
          {vm.pending.map((p) => (
            <List.Item
              key={p.listing.id}
              title={`Calificar ${ratedRoleLabel[p.role].toLowerCase()}`}
              description={listingTitle(p.listing)}
              left={(props) => <List.Icon {...props} icon="star-outline" />}
              right={() => (
                <Button mode="contained" disabled={vm.saving} onPress={() => setRating(p)}>
                  Calificar
                </Button>
              )}
            />
          ))}
        </Card>
      ) : null}

      {section("Vende ahora", vm.selling, "No tiene publicaciones activas.")}
      {section("Ha vendido", vm.sold, "Todavía no ha vendido nada por aquí.")}
      {section("Ha comprado", vm.bought, "Todavía no ha comprado nada por aquí.")}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Calificaciones
      </Text>
      {vm.received.length === 0 ? (
        <Text variant="bodySmall" style={styles.emptyText}>Nadie la ha calificado todavía. Solo puede hacerlo quien le compró o le vendió.</Text>
      ) : (
        vm.received.map((r) => (
          <View key={r.id} style={styles.review}>
            <View style={styles.row}>
              <StarRating stars={r.stars} size={16} />
              <Text variant="bodySmall" style={styles.flex} numberOfLines={1}>
                {r.raterName} · {ratedRoleLabel[r.ratedRole].toLowerCase()}
              </Text>
              <Text variant="bodySmall">{Formatters.relative(r.createdAt)}</Text>
            </View>
            {r.comment ? <Text variant="bodyMedium">{r.comment}</Text> : null}
          </View>
        ))
      )}

      <RateSheet
        visible={rating != null}
        personName={name}
        role={rating?.role ?? "seller"}
        listingTitle={rating ? listingTitle(rating.listing) : ""}
        onDismiss={() => setRating(null)}
        onSubmit={({ stars, comment }) => {
          const p = rating;
          setRating(null);
          if (p) vm.rate(p, stars, comment);
        }}
      />
    </ScrollView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="titleMedium">{value}</Text>
      <Text variant="bodySmall">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 48 },
  container: { paddingVertical: 16, paddingBottom: 48 },
  header: { alignItems: "center", gap: 6, paddingHorizontal: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  stats: { flexDirection: "row", gap: 24, marginTop: 8 },
  stat: { alignItems: "center" },
  pending: { marginHorizontal: 16, marginTop: 24 },
  section: { marginTop: 24 },
  sectionTitle: { marginHorizontal: 16, marginBottom: 8, marginTop: 8 },
  review: { marginHorizontal: 16, marginBottom: 16, gap: 4 },
  flex: { flex: 1 },
  emptyText: { marginHorizontal: 16 },
});
