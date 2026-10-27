import { useNavigation } from "@react-navigation/native";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Button, Card, HelperText, Text, TextInput } from "react-native-paper";

import { ChoiceChips } from "@/src/core/components/ChoiceChips";
import { SelectField } from "@/src/core/components/SelectField";
import { useSnackbar } from "@/src/core/feedback/SnackbarProvider";
import { FUEL_TYPES, fuelLabel, TRANSMISSION_TYPES, transmissionLabel } from "../../domain/entities/CarListing";
import { useCreateListingViewModel } from "../viewmodels/useCreateListingViewModel";

// Publicar un carro: características básicas. Solo se llega aquí con cuenta.
export default function CreateListingScreen() {
  const navigation = useNavigation();
  const vm = useCreateListingViewModel();
  const snackbar = useSnackbar();

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Sin almacenamiento no hay dónde subir una foto, así que el formulario no
          la pide en vez de aceptar algo que se perdería. */}
      <Card mode="outlined">
        <Card.Title
          title="Todavía no se pueden subir fotos"
          subtitle="Tu publicación se verá con un color de fondo."
          subtitleNumberOfLines={2}
          left={(p) => <Avatar.Icon {...p} icon="camera-off-outline" />}
        />
      </Card>
      <SelectField
        label="Marca"
        value={vm.brand?.id ?? null}
        options={vm.brands.map((b) => ({ value: b.id, label: b.name }))}
        onSelect={(id) => {
          const brand = vm.brands.find((b) => b.id === id);
          if (brand) vm.selectBrand(brand);
        }}
      />
      <SelectField
        label="Modelo"
        value={vm.model?.id ?? null}
        disabled={vm.models.length === 0}
        // Sin marca no hay modelos, y decirlo es mejor que una lista vacía.
        helper={vm.brand == null ? "Elige primero la marca" : undefined}
        options={vm.models.map((m) => ({ value: m.id, label: m.name }))}
        onSelect={(id) => vm.selectModel(vm.models.find((m) => m.id === id) ?? null)}
      />
      <View style={styles.row}>
        <TextInput style={styles.flex} mode="outlined" label="Año" keyboardType="number-pad" value={vm.form.year} onChangeText={vm.setField("year")} />
        <TextInput style={styles.flex} mode="outlined" label="Kilometraje" keyboardType="number-pad" value={vm.form.mileage} onChangeText={vm.setField("mileage")} />
      </View>
      <TextInput mode="outlined" label="Precio" keyboardType="number-pad" value={vm.form.price} onChangeText={vm.setField("price")} />
      <TextInput mode="outlined" label="Ciudad" value={vm.form.city} onChangeText={vm.setField("city")} />
      <Text variant="labelLarge">Combustible</Text>
      <ChoiceChips compact options={FUEL_TYPES.map((f) => ({ value: f, label: fuelLabel[f] }))} selected={vm.fuel} onSelect={vm.setFuel} />
      <Text variant="labelLarge">Transmisión</Text>
      <ChoiceChips
        compact
        options={TRANSMISSION_TYPES.map((t) => ({ value: t, label: transmissionLabel[t] }))}
        selected={vm.transmission}
        onSelect={vm.setTransmission}
      />
      <TextInput mode="outlined" label="Descripción" multiline numberOfLines={4} value={vm.form.description} onChangeText={vm.setField("description")} />
      {vm.error ? <HelperText type="error">{vm.error}</HelperText> : null}
      <Button
        mode="contained"
        loading={vm.saving}
        disabled={vm.saving}
        contentStyle={styles.cta}
        onPress={async () => {
          const created = await vm.submit();
          if (!created) return;
          snackbar("Publicación creada.");
          navigation.goBack();
        }}
      >
        Publicar
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12, paddingBottom: 40 },
  row: { flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
  cta: { height: 48 },
});
