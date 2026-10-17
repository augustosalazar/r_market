import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { ActivityIndicator, Badge, Button, Divider, HelperText, List, Text } from "react-native-paper";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Formatters } from "@/src/core/utils/formatters";
import { CarPhoto } from "@/src/core/widgets/CarPhoto";
import { EmptyState } from "@/src/core/widgets/EmptyState";
import { useSession } from "@/src/features/auth/presentation/context/SessionContext";
import { otherName } from "../../domain/entities/Chat";
import { useChatsViewModel } from "../viewmodels/useChatsViewModel";

export default function ChatsScreen() {
  const navigation = useNavigation();
  const session = useSession();
  const vm = useChatsViewModel();

  // Al volver de un chat, el último mensaje y el contador cambiaron.
  const { load } = vm;
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!session.isLoggedIn) {
    return (
      <EmptyState
        icon="forum-outline"
        title="Entra para chatear"
        message="Los chats privados son entre comprador y vendedor."
        action={
          <Button mode="contained" onPress={() => navigation.navigate("Login")}>
            Entrar
          </Button>
        }
      />
    );
  }
  if (vm.loading && vm.threads.length === 0) return <ActivityIndicator style={styles.loader} />;

  return (
    <FlatList
      data={vm.threads}
      keyExtractor={(t) => t.id}
      refreshing={false}
      onRefresh={vm.load}
      ItemSeparatorComponent={Divider}
      contentContainerStyle={vm.threads.length === 0 ? styles.empty : undefined}
      ListHeaderComponent={vm.error ? <HelperText type="error">{vm.error}</HelperText> : null}
      ListEmptyComponent={
        <EmptyState icon="chat-outline" title="Sin chats todavía" message="Abre una publicación y escríbele al vendedor." />
      }
      renderItem={({ item }) => (
        <List.Item
          title={otherName(item, vm.myId ?? "")}
          description={`${item.listingTitle}\n${item.lastMessage || "Sin mensajes"}`}
          descriptionNumberOfLines={2}
          onPress={() => navigation.navigate("Chat", { threadId: item.id })}
          left={() => (
            <View style={styles.cover}>
              <CarPhoto source={item.listingCover} seed={item.listingId} />
            </View>
          )}
          right={() => (
            <View style={styles.meta}>
              <Text variant="labelSmall">{Formatters.relative(item.lastMessageAt)}</Text>
              <View style={styles.badges}>
                {item.muted ? <MaterialCommunityIcons name="bell-off-outline" size={16} /> : null}
                {item.unreadCount > 0 ? <Badge>{item.unreadCount}</Badge> : null}
              </View>
            </View>
          )}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 48 },
  empty: { flexGrow: 1 },
  cover: { width: 48, height: 48, borderRadius: 10, overflow: "hidden", marginLeft: 16, alignSelf: "center" },
  meta: { alignItems: "flex-end", justifyContent: "center", gap: 4 },
  badges: { flexDirection: "row", alignItems: "center", gap: 4 },
});
