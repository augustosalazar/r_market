import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useLayoutEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { ActivityIndicator, IconButton, Text, TextInput, useTheme } from "react-native-paper";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Formatters } from "@/src/core/utils/formatters";
import { RootStackParamList } from "@/src/navigation/types";
import { otherName } from "../../domain/entities/Chat";
import { useChatViewModel } from "../viewmodels/useChatViewModel";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

// Un chat privado. La campana de la barra silencia el hilo para quien mira.
export default function ChatScreen({ route, navigation }: Props) {
  const vm = useChatViewModel(route.params.threadId);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [text, setText] = useState("");
  const list = useRef<FlatList>(null);

  useLayoutEffect(() => {
    const t = vm.thread;
    navigation.setOptions({
      headerTitle: () =>
        t ? (
          <View>
            <Text variant="titleMedium">{otherName(t, vm.myId)}</Text>
            <Text variant="labelSmall">{t.listingTitle}</Text>
          </View>
        ) : (
          <Text variant="titleMedium">Chat</Text>
        ),
      headerRight: () => (
        <IconButton
          icon={t?.muted ? "bell-off" : "bell-ring-outline"}
          onPress={vm.toggleMuted}
          accessibilityLabel={t?.muted ? "Reactivar avisos" : "Silenciar este chat"}
        />
      ),
    });
  });

  const send = async () => {
    if (!text.trim()) return;
    const body = text;
    setText("");
    await vm.send(body);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={headerHeight}>
      {vm.loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : vm.messages.length === 0 ? (
        <View style={styles.center}>
          <Text>Escribe el primer mensaje.</Text>
        </View>
      ) : (
        <FlatList
          ref={list}
          data={vm.messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const mine = item.senderId === vm.myId;
            return (
              <View
                style={[
                  styles.bubble,
                  mine ? styles.mine : styles.theirs,
                  { backgroundColor: mine ? colors.primaryContainer : colors.surfaceVariant },
                ]}
              >
                <Text variant="bodyMedium">{item.text}</Text>
                <Text variant="labelSmall" style={styles.time}>
                  {Formatters.time(item.sentAt)}
                </Text>
              </View>
            );
          }}
        />
      )}
      <View style={[styles.composer, { paddingBottom: 12 + insets.bottom }]}>
        <TextInput
          style={styles.flex}
          mode="outlined"
          dense
          placeholder="Mensaje"
          accessibilityLabel="Mensaje"
          value={text}
          onChangeText={setText}
          multiline
        />
        <IconButton mode="contained" icon="send" onPress={send} disabled={vm.sending} accessibilityLabel="Enviar" />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { marginTop: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16 },
  bubble: { maxWidth: "75%", paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8, borderRadius: 16, marginBottom: 8 },
  mine: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  theirs: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  time: { alignSelf: "flex-end", marginTop: 2, opacity: 0.7 },
  composer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, gap: 4 },
  flex: { flex: 1 },
});
