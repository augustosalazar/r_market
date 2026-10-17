import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Surface, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

// Lo que se ve cuando la app arranca sin `.env`. Sin configuración no se puede
// crear el cliente de Roble, y todo lo demás depende de él.
export function MissingConfigScreen({ missing }: { missing: string[] }) {
  return (
    <Surface style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container}>
          <MaterialCommunityIcons name="cog-outline" size={56} />
          <Text variant="headlineSmall">Falta la configuración</Text>
          <Text>La app no sabe a qué servidor de Roble conectarse. Estos valores salen del archivo .env y no llegaron:</Text>
          {missing.map((name) => (
            <Text key={name} style={styles.mono}>
              •  {name}
            </Text>
          ))}
          <Text>Para arreglarlo:</Text>
          <Text>1. Copia .env.example como .env y llena los valores.</Text>
          <Text>2. Reinicia con:</Text>
          <Text selectable style={styles.mono}>
            npx expo start --clear
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 24, gap: 12 },
  mono: { fontFamily: "monospace" },
});
