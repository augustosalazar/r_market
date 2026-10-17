import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, FAB, SegmentedButtons } from "react-native-paper";

import { EmptyState } from "@/src/core/widgets/EmptyState";
import { useSession } from "@/src/features/auth/presentation/context/SessionContext";
import { useMyListingsViewModel } from "../viewmodels/useMyListingsViewModel";
import { ListingCard } from "../widgets/ListingCard";
import { StatusPicker } from "../widgets/StatusPicker";
import { useSellSheet } from "../widgets/useSellSheet";

// Lo mío: lo que vendo, y lo que sigo (que es lo que me genera avisos).
export default function MyListingsScreen() {
  const navigation = useNavigation();
  const session = useSession();
  const vm = useMyListingsViewModel();
  const [tab, setTab] = useState<"selling" | "following">("selling");
  const sell = useSellSheet(vm.buyerCandidates, (listing, choice) =>
    "unregistered" in choice ? vm.changeStatus(listing, "sold") : vm.markSold(listing, choice.buyerId, choice.buyerName),
  );

  // Al volver de publicar, la lista tiene que traer lo nuevo.
  const { refresh } = vm;
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (!session.isLoggedIn) {
    return (
      <EmptyState
        icon="lock-outline"
        title="Entra para ver lo tuyo"
        message="Necesitas una cuenta para publicar y seguir carros."
        action={
          <Button testID={MyListingsScreen.signInButtonKey} mode="contained" onPress={() => navigation.navigate("Login")}>
            Entrar
          </Button>
        }
      />
    );
  }

  const data = tab === "selling" ? vm.selling : vm.following;
  return (
    <View style={styles.container}>
      <SegmentedButtons
        style={styles.tabs}
        value={tab}
        onValueChange={(v) => setTab(v as typeof tab)}
        buttons={[
          { value: "selling", label: "Mis publicaciones" },
          { value: "following", label: "Siguiendo", testID: MyListingsScreen.followingTabKey },
        ]}
      />
      {vm.loading && data.length === 0 ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <FlatList
          testID={MyListingsScreen.listKey}
          data={data}
          keyExtractor={(l) => l.id}
          contentContainerStyle={data.length === 0 ? styles.empty : styles.list}
          ListEmptyComponent={
            tab === "selling" ? (
              <EmptyState icon="tag-outline" title="Aún no vendes nada" message="Publica tu carro y recibirás avisos cuando pregunten." />
            ) : (
              <EmptyState
                icon="star-outline"
                title="No sigues ninguna publicación"
                message="Marca con la estrella los carros que te interesan: te avisaremos de preguntas, respuestas y cambios de estado."
              />
            )
          }
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              isFollowed={tab === "following"}
              onPress={() => navigation.navigate("ListingDetail", { listingId: item.id })}
              footer={
                tab === "selling" ? (
                  <StatusPicker status={item.status} onSelect={(s) => (s === "sold" ? sell.open(item) : vm.changeStatus(item, s))} />
                ) : undefined
              }
            />
          )}
        />
      )}
      <FAB
        icon="plus"
        label="Publicar"
        style={styles.fab}
        onPress={() => session.ensureLoggedIn() && navigation.navigate("CreateListing")}
      />
      {sell.sheet}
    </View>
  );
}

MyListingsScreen.listKey = "mine.list";
MyListingsScreen.followingTabKey = "mine.tab.following";
MyListingsScreen.signInButtonKey = "mine.signIn";

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { marginHorizontal: 16, marginTop: 8, marginBottom: 4 },
  loader: { marginTop: 48 },
  list: { paddingTop: 4, paddingBottom: 96 },
  empty: { flexGrow: 1 },
  fab: { position: "absolute", right: 16, bottom: 16 },
});
