import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useLayoutEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Avatar, Button, Divider, IconButton, List, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Formatters, initialsOf } from "@/src/core/utils/formatters";
import { CarPhoto } from "@/src/core/components/CarPhoto";
import { useSession } from "@/src/features/auth/presentation/context/SessionContext";
import { DisplayNameSheet } from "@/src/features/auth/presentation/components/DisplayNameSheet";
import { QuestionList } from "@/src/features/qa/presentation/components/QuestionList";
import { RootStackParamList } from "@/src/navigation/types";
import { CarListing, fuelLabel, listingCover, listingTitle, transmissionLabel } from "../../domain/entities/CarListing";
import { useListingDetailViewModel } from "../viewmodels/useListingDetailViewModel";
import { StatusChip } from "../components/StatusChip";
import { StatusPicker } from "../components/StatusPicker";
import { useSellSheet } from "../components/useSellSheet";

type Props = NativeStackScreenProps<RootStackParamList, "ListingDetail">;

// La ficha completa de una publicación, con sus preguntas públicas.
export default function ListingDetailScreen({ route, navigation }: Props) {
  const vm = useListingDetailViewModel(route.params.listingId);
  const session = useSession();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // La pregunta que espera el nombre del invitado antes de publicarse.
  const [pendingQuestion, setPendingQuestion] = useState<{ text: string; resolve: (ok: boolean) => void } | null>(null);

  const sell = useSellSheet(vm.buyerCandidates, (_listing, choice) =>
    "unregistered" in choice ? vm.changeStatus("sold") : vm.markSold(choice.buyerId, choice.buyerName),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: vm.listing ? listingTitle(vm.listing) : "",
      headerRight: () => (
        <IconButton
          icon={vm.isFollowing ? "star" : "star-outline"}
          onPress={vm.toggleFollow}
          accessibilityLabel={vm.isFollowing ? "Dejar de seguir" : "Seguir y recibir avisos"}
        />
      ),
    });
  });

  // Preguntar no exige cuenta, pero sí un nombre con el que firmar. El orden
  // importa: primero la sesión (de invitado si hace falta), luego el nombre.
  const ask = async (text: string): Promise<boolean> => {
    if (!(await session.ensureWritableSession())) return false;
    const me = session.currentUser();
    if (me?.isAnonymous && session.guestName == null) {
      return new Promise((resolve) => setPendingQuestion({ text, resolve }));
    }
    return vm.ask(text);
  };

  if (vm.loading) return <ActivityIndicator style={styles.loader} />;
  const listing = vm.listing;
  if (!listing) {
    return (
      <View style={styles.center}>
        <Text>La publicación ya no existe.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <View style={styles.photo}>
          <CarPhoto source={listingCover(listing)} seed={listing.id} />
        </View>
        <View style={styles.body}>
          <View style={styles.row}>
            <Text variant="headlineSmall" style={styles.flex}>
              {listingTitle(listing)}
            </Text>
            <StatusChip status={listing.status} />
          </View>
          <Text variant="headlineMedium" style={{ color: colors.primary, fontWeight: "700", marginTop: 6 }}>
            {Formatters.price(listing.price)}
          </Text>
          <Specs listing={listing} />
          <Text variant="titleMedium" style={styles.section}>
            Descripción
          </Text>
          <Text variant="bodyMedium">{listing.description || "Sin descripción."}</Text>

          {/* Antes de escribirle conviene poder mirar a quién le compras. */}
          <List.Item
            style={styles.item}
            title={listing.sellerName}
            description={`Publicado ${Formatters.relative(listing.createdAt)}`}
            left={() => <Avatar.Text size={40} label={initialsOf(listing.sellerName)} />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => navigation.navigate("UserProfile", { userId: listing.sellerId, name: listing.sellerName })}
            accessibilityLabel={`Perfil de ${listing.sellerName}`}
          />
          {listing.buyerName ? (
            <List.Item
              style={styles.item}
              title={`Vendido a ${listing.buyerName}`}
              description={listing.soldAt ? Formatters.date(listing.soldAt) : undefined}
              left={() => <Avatar.Icon size={40} icon="handshake-outline" />}
            />
          ) : null}

          {vm.isOwner ? (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleMedium" style={styles.sectionTight}>
                Estado de la publicación
              </Text>
              <StatusPicker status={listing.status} onSelect={(s) => (s === "sold" ? sell.open(listing) : vm.changeStatus(s))} />
            </>
          ) : null}
          <Divider style={styles.divider} />
          <QuestionList questions={vm.questions} isOwner={vm.isOwner} onAsk={ask} onAnswer={vm.answer} />
        </View>
      </ScrollView>

      {!vm.isOwner ? (
        <View style={[styles.bottom, { paddingBottom: 12 + insets.bottom, backgroundColor: colors.background }]}>
          <Button mode="contained" icon="forum-outline" onPress={vm.openPrivateChat} loading={vm.sending} contentStyle={styles.cta}>
            Chat privado con el vendedor
          </Button>
        </View>
      ) : null}

      {sell.sheet}
      <DisplayNameSheet
        visible={pendingQuestion != null}
        onDismiss={() => {
          // Sin nombre no se publica: firmar «Invitado» es lo que veníamos a evitar.
          pendingQuestion?.resolve(false);
          setPendingQuestion(null);
        }}
        onDone={async (name) => {
          const pending = pendingQuestion;
          setPendingQuestion(null);
          if (!pending || !session.setGuestName(name)) return pending?.resolve(false);
          pending.resolve(await vm.ask(pending.text, name));
        }}
      />
    </View>
  );
}

function Specs({ listing }: { listing: CarListing }) {
  const { colors } = useTheme();
  const items: [React.ComponentProps<typeof MaterialCommunityIcons>["name"], string, string][] = [
    ["calendar-outline", "Año", String(listing.year)],
    ["speedometer", "Kilometraje", Formatters.mileage(listing.mileageKm)],
    ["gas-station-outline", "Combustible", fuelLabel[listing.fuel]],
    ["cog-outline", "Transmisión", transmissionLabel[listing.transmission]],
    ["map-marker-outline", "Ciudad", listing.city],
  ];
  return (
    <View style={styles.specs}>
      {items.map(([icon, label, value]) => (
        <View key={label} style={[styles.spec, { backgroundColor: colors.surfaceVariant }]}>
          <MaterialCommunityIcons name={icon} size={18} color={colors.onSurfaceVariant} />
          <View style={styles.flex}>
            <Text variant="labelSmall">{label}</Text>
            <Text variant="bodyMedium" numberOfLines={1}>
              {value}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { marginTop: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  photo: { height: 260 },
  body: { padding: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  flex: { flex: 1 },
  section: { marginTop: 20, marginBottom: 6 },
  sectionTight: { marginBottom: 8 },
  item: { paddingHorizontal: 0 },
  divider: { marginVertical: 16 },
  specs: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16 },
  spec: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, width: "47%" },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 8 },
  cta: { height: 48 },
});
