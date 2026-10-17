import { StackActions, useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";

import { useSession } from "../context/SessionContext";

export default function RegisterScreen() {
  const navigation = useNavigation();
  const session = useSession();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmation: "" });
  const set = (field: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [field]: value }));
  const { clearError } = session;

  useEffect(() => {
    clearError();
  }, [clearError]);

  const submit = async () => {
    // Se cierran las dos rutas: registro y login.
    if (await session.register(form)) navigation.dispatch(StackActions.pop(2));
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TextInput mode="outlined" label="Nombre" autoCapitalize="words" value={form.name} onChangeText={set("name")} />
      <TextInput mode="outlined" label="Correo" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={set("email")} />
      <TextInput mode="outlined" label="Contraseña" secureTextEntry value={form.password} onChangeText={set("password")} />
      <TextInput mode="outlined" label="Repite la contraseña" secureTextEntry value={form.confirmation} onChangeText={set("confirmation")} />
      {session.error ? <HelperText type="error">{session.error}</HelperText> : null}
      <Button mode="contained" onPress={submit} loading={session.busy} disabled={session.busy} contentStyle={styles.cta}>
        Crear cuenta
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  cta: { height: 48 },
});
