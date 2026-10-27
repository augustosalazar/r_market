import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";

import { carAssets } from "../data/carAssets";

// La foto de un carro venga de donde venga: `assets/...` son las ilustraciones
// de los datos de prueba y `http...` una URL —lo que devolverá Roble—. Sin foto
// (o si falla), se pinta un color estable por publicación, igual que en f_market.
export function CarPhoto({ source, seed }: { source?: string | null; seed?: string }) {
  const [failed, setFailed] = useState(false);
  const asset = source ? carAssets[source] : undefined;
  if (asset != null) return <Image source={asset} style={styles.fill} contentFit="cover" />;
  if (source && source.startsWith("http") && !failed) {
    return <Image source={{ uri: source }} style={styles.fill} contentFit="cover" onError={() => setFailed(true)} />;
  }
  const hue = hashOf(seed ?? source ?? "") % 360;
  return (
    <View style={[styles.fill, styles.center, { backgroundColor: `hsl(${hue}, 32%, 52%)` }]}>
      <MaterialCommunityIcons name="car" size={44} color="rgba(255,255,255,0.75)" />
    </View>
  );
}

function hashOf(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
  center: { alignItems: "center", justifyContent: "center" },
});
