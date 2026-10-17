import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect } from "react";
import { FlatList, StyleSheet } from "react-native";
import { Avatar, Button, Divider, List, Text, useTheme } from "react-native-paper";

import { Formatters } from "@/src/core/utils/formatters";
import { EmptyState } from "@/src/core/widgets/EmptyState";
import { useSession } from "@/src/features/auth/presentation/context/SessionContext";
import { NotificationKind } from "../../domain/entities/AppNotification";
import { useNotifications } from "../context/NotificationsContext";

const iconOf: Record<NotificationKind, string> = {
  question: "help-circle-outline",
  answer: "forum-outline",
  statusChange: "swap-horizontal",
  chatMessage: "chat-outline",
};

// La bandeja: lo guardado en Roble, y encima lo que llega por el socket.
export default function NotificationsScreen() {
  const navigation = useNavigation();
  const session = useSession();
  const vm = useNotifications();
  const { colors } = useTheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button disabled={vm.unreadCount === 0} onPress={vm.markAllRead}>
          Marcar leídas
        </Button>
      ),
    });
  }, [navigation, vm.unreadCount, vm.markAllRead]);

  if (!session.isLoggedIn) {
    return (
      <EmptyState
        icon="bell-outline"
        title="Entra para ver tus avisos"
        message="Te avisamos de preguntas, respuestas, cambios de estado y mensajes privados."
        action={
          <Button mode="contained" onPress={() => navigation.navigate("Login")}>
            Entrar
          </Button>
        }
      />
    );
  }

  return (
    <FlatList
      data={vm.items}
      keyExtractor={(n) => n.id}
      refreshing={vm.loading}
      onRefresh={vm.refresh}
      ItemSeparatorComponent={Divider}
      contentContainerStyle={vm.items.length === 0 ? styles.empty : undefined}
      ListEmptyComponent={<EmptyState icon="bell-outline" title="Nada nuevo" message="Aquí aparecerán tus avisos." />}
      renderItem={({ item }) => (
        <List.Item
          title={item.title}
          titleStyle={{ fontWeight: item.read ? "400" : "700" }}
          description={item.body}
          descriptionNumberOfLines={2}
          left={() => (
            <Avatar.Icon
              size={40}
              icon={iconOf[item.kind]}
              style={[styles.icon, { backgroundColor: item.read ? colors.surfaceVariant : colors.primaryContainer }]}
              color={colors.onSurface}
            />
          )}
          right={() => <Text variant="labelSmall">{Formatters.relative(item.createdAt)}</Text>}
          onPress={() => {
            vm.markRead(item);
            if (item.threadId) navigation.navigate("Chat", { threadId: item.threadId });
            else if (item.listingId) navigation.navigate("ListingDetail", { listingId: item.listingId });
          }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flexGrow: 1 },
  icon: { marginLeft: 16, alignSelf: "center" },
});
