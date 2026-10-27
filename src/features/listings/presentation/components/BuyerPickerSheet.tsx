import React from "react";
import { StyleSheet } from "react-native";
import { Divider, List, Text } from "react-native-paper";

import { BottomSheet } from "@/src/core/components/BottomSheet";
import { ChatThread } from "@/src/features/chat/domain/entities/Chat";

// Lo que el vendedor decidió al cerrar la venta. Sin comprador, la publicación
// se cierra igual pero la venta no queda registrada y nadie podrá calificarla.
export type SoldChoice = { buyerId: string; buyerName: string } | { unregistered: true };

// Pregunta a quién se le vendió. Los candidatos son quienes abrieron un chat
// sobre la publicación: es lo único que la app sabe de posibles compradores.
export function BuyerPickerSheet({
  visible,
  candidates,
  onChoose,
  onDismiss,
}: {
  visible: boolean;
  candidates: ChatThread[];
  onChoose: (choice: SoldChoice) => void;
  onDismiss: () => void;
}) {
  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <Text variant="titleLarge">¿A quién se lo vendiste?</Text>
      <Text variant="bodySmall" style={styles.hint}>
        {candidates.length === 0
          ? "Nadie te ha escrito por esta publicación, así que no hay a quién registrar."
          : "Registrarlo deja la venta en el historial de los dos y les permite calificarse."}
      </Text>
      {candidates.map((t) => (
        <List.Item
          key={t.id}
          title={t.buyerName}
          left={(props) => <List.Icon {...props} icon="account-outline" />}
          onPress={() => onChoose({ buyerId: t.buyerId, buyerName: t.buyerName })}
        />
      ))}
      <Divider />
      <List.Item
        title="Se vendió por fuera"
        description="Cierra la publicación sin registrar comprador"
        left={(props) => <List.Icon {...props} icon="help-circle-outline" />}
        onPress={() => onChoose({ unregistered: true })}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  hint: { marginTop: 4, marginBottom: 12 },
});
