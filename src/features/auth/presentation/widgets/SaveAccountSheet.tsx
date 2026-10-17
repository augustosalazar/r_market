import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";

import { BottomSheet } from "@/src/core/widgets/BottomSheet";

export type SaveAccountForm = { name: string; email: string; password: string; confirmation: string };

// Convierte al invitado en una cuenta. No se llama «registrarse» a propósito:
// quien llega aquí ya tiene sesión y cosas suyas, y Roble **muta** el usuario
// que ya existe, conservando su id: no se pierde nada.
type Props = {
  visible: boolean;
  followedCount: number;
  initialName: string | null;
  busy: boolean;
  error: string | null;
  onSubmit: (form: SaveAccountForm) => void;
  onDismiss: () => void;
};

export function SaveAccountSheet(props: Props) {
  return (
    <BottomSheet visible={props.visible} onDismiss={props.onDismiss}>
      {props.visible ? <AccountForm {...props} /> : null}
    </BottomSheet>
  );
}

function AccountForm({ followedCount, initialName, busy, error, onSubmit }: Props) {
  // Que la cuenta nazca con el mismo nombre con el que ya firmó sus preguntas.
  const [form, setForm] = useState<SaveAccountForm>({ name: initialName ?? "", email: "", password: "", confirmation: "" });
  const set = (field: keyof SaveAccountForm) => (value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <>
      <Text variant="titleLarge">Guarda tu cuenta</Text>
      <Text variant="bodySmall" style={styles.hint}>
        {followedCount === 0
          ? "Ahora mismo estás como invitado: si pierdes este teléfono, pierdes lo que llevas."
          : `Conservas ${followedCount === 1 ? "la publicación que sigues" : `las ${followedCount} publicaciones que sigues`}, y podrás entrar desde otro teléfono.`}
      </Text>
      <TextInput style={styles.field} mode="outlined" label="Tu nombre" autoCapitalize="words" value={form.name} onChangeText={set("name")} />
      <TextInput style={styles.field} mode="outlined" label="Correo" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={set("email")} />
      <TextInput style={styles.field} mode="outlined" label="Contraseña" secureTextEntry value={form.password} onChangeText={set("password")} />
      <TextInput style={styles.field} mode="outlined" label="Repite la contraseña" secureTextEntry value={form.confirmation} onChangeText={set("confirmation")} />
      {error ? <HelperText type="error">{error}</HelperText> : null}
      <Button mode="contained" loading={busy} disabled={busy} onPress={() => onSubmit(form)} contentStyle={styles.cta}>
        Guardar mi cuenta
      </Button>
    </>
  );
}

const styles = StyleSheet.create({
  hint: { marginTop: 4, marginBottom: 16 },
  field: { marginBottom: 12 },
  cta: { height: 48 },
});
