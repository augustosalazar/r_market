import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { ActivityIndicator, Badge, Button, HelperText, IconButton, Searchbar } from "react-native-paper";

import { EmptyState } from "@/src/core/widgets/EmptyState";
import { isFilterEmpty } from "../../domain/entities/ListingFilter";
import { useCatalogViewModel } from "../viewmodels/useCatalogViewModel";
import { BrandStrip } from "../widgets/BrandStrip";
import { FilterSheet } from "../widgets/FilterSheet";
import { ListingCard } from "../widgets/ListingCard";

// El catálogo: la primera pantalla y la única que se ve sin sesión.
export default function CatalogScreen() {
  const navigation = useNavigation();
  const vm = useCatalogViewModel();
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const active = !isFilterEmpty(vm.filter);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View>
          <IconButton icon="tune-variant" onPress={() => setFiltersOpen(true)} accessibilityLabel="Filtrar" />
          {active ? <Badge size={8} style={styles.dot} /> : null}
        </View>
      ),
    });
  }, [navigation, active]);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Marca, modelo o ciudad"
        value={query}
        onChangeText={(t) => {
          setQuery(t);
          vm.onQueryChanged(t);
        }}
        style={styles.search}
      />
      <View style={styles.strip}>
        <BrandStrip brands={vm.brands} selected={vm.filter.brand} onSelected={vm.selectBrand} />
      </View>
      {vm.error ? <HelperText type="error">{vm.error}</HelperText> : null}
      {vm.loading && vm.listings.length === 0 ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <FlatList
          testID={CatalogScreen.listKey}
          data={vm.listings}
          keyExtractor={(l) => l.id}
          refreshing={false}
          onRefresh={vm.refresh}
          contentContainerStyle={vm.listings.length === 0 ? styles.empty : styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="magnify-close"
              title="Sin resultados"
              message="Prueba con otra búsqueda o quita los filtros."
              action={
                <Button
                  mode="outlined"
                  onPress={() => {
                    setQuery("");
                    vm.clearFilter();
                  }}
                >
                  Quitar filtros
                </Button>
              }
            />
          }
          renderItem={({ item }) => (
            <ListingCard
              testID={CatalogScreen.cardKey(item.id)}
              listing={item}
              isFollowed={vm.followed.has(item.id)}
              onToggleFollow={() => vm.toggleFollow(item.id)}
              onPress={() => navigation.navigate("ListingDetail", { listingId: item.id })}
            />
          )}
        />
      )}
      <FilterSheet
        visible={filtersOpen}
        initial={vm.filter}
        brands={vm.brands.map((b) => b.name)}
        onDismiss={() => setFiltersOpen(false)}
        onApply={(f) => {
          setFiltersOpen(false);
          vm.applyFilter(f);
        }}
      />
    </View>
  );
}

// Las claves que usan las pruebas para llegar a la lista sin depender de su texto.
CatalogScreen.listKey = "catalog.list";
// La tarjeta de una publicación, por su id.
CatalogScreen.cardKey = (listingId: string) => `catalog.card.${listingId}`;

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: { marginHorizontal: 16, marginTop: 8 },
  strip: { marginVertical: 10 },
  loader: { marginTop: 48 },
  list: { paddingTop: 4, paddingBottom: 24 },
  empty: { flexGrow: 1 },
  dot: { position: "absolute", top: 10, right: 10 },
});
