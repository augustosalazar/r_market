import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";

import { useSession } from "../context/SessionContext";

// Entrar con correo y contraseña.
export default function LoginScreen() {
  const navigation = useNavigation();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { clearError } = session;

  useEffect(() => {
    clearError();
  }, [clearError]);

  const submit = async () => {
    if (await session.login(email, password)) navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text variant="bodyLarge" style={styles.intro}>
        Entra para publicar, preguntar y chatear.
      </Text>
      <TextInput
        testID={LoginScreen.emailFieldKey}
        mode="outlined"
        label="Correo"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput testID={LoginScreen.passwordFieldKey} mode="outlined" label="Contraseña" secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={submit} />
      {session.error ? <HelperText type="error">{session.error}</HelperText> : null}
      <Button testID={LoginScreen.submitButtonKey} mode="contained" onPress={submit} loading={session.busy} disabled={session.busy} contentStyle={styles.cta}>
        Entrar
      </Button>
      <Button onPress={() => navigation.navigate("Register")}>No tengo cuenta, quiero registrarme</Button>
    </ScrollView>
  );
}

// Las claves con las que las pruebas llegan a cada control sin depender de su
// texto (en Flutter eran `Key`; en React Native, `testID`).
LoginScreen.emailFieldKey = "login.email";
LoginScreen.passwordFieldKey = "login.password";
LoginScreen.submitButtonKey = "login.submit";

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  intro: { marginBottom: 12 },
  cta: { height: 48 },
});
