import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";

import { BottomSheet } from "@/src/core/widgets/BottomSheet";

// Pide a un invitado con qué nombre firmar. Se pregunta una sola vez y justo
// antes de su primera pregunta, no al entrar: pedir datos a quien todavía está
// mirando es lo que hace que se vaya.
export function DisplayNameSheet({
  visible,
  onDone,
  onDismiss,
}: {
  visible: boolean;
  onDone: (name: string) => void;
  onDismiss: () => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const done = () => {
    const clean = name.trim();
    if (clean.length < 3) return setError("Al menos 3 caracteres.");
    setError(null);
    onDone(clean);
  };

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <Text variant="titleLarge">¿Cómo te llamamos?</Text>
      <Text variant="bodySmall" style={styles.hint}>
        Tu pregunta se publica con este nombre, y el vendedor lo verá al responderte. No hace falta cuenta.
      </Text>
      <TextInput
        mode="outlined"
        label="Tu nombre"
        autoFocus
        autoCapitalize="words"
        value={name}
        onChangeText={setName}
        onSubmitEditing={done}
        error={error != null}
      />
      <HelperText type="error" visible={error != null}>
        {error}
      </HelperText>
      <Button mode="contained" onPress={done} contentStyle={styles.button}>
        Seguir
      </Button>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  hint: { marginTop: 4, marginBottom: 16 },
  button: { height: 48 },
});
