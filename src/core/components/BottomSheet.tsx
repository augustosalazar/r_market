import React from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Una hoja que sube desde abajo, para las decisiones cortas (filtros, a quién se
// vendió, calificar). Tocar fuera la cierra sin elegir nada.
export function BottomSheet({
  visible,
  onDismiss,
  children,
}: {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.backdrop }]} onPress={onDismiss} accessibilityLabel="Cerrar" />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.elevation.level1, paddingBottom: 20 + insets.bottom },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.outlineVariant }]} />
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 8, maxHeight: "90%" },
  handle: { alignSelf: "center", width: 32, height: 4, borderRadius: 2, marginBottom: 12 },
});
