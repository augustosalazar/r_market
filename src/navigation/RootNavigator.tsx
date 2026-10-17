import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import LoginScreen from "../features/auth/presentation/screens/LoginScreen";
import ProfileScreen from "../features/auth/presentation/screens/ProfileScreen";
import RegisterScreen from "../features/auth/presentation/screens/RegisterScreen";
import ChatScreen from "../features/chat/presentation/screens/ChatScreen";
import ChatsScreen from "../features/chat/presentation/screens/ChatsScreen";
import CatalogScreen from "../features/listings/presentation/screens/CatalogScreen";
import CreateListingScreen from "../features/listings/presentation/screens/CreateListingScreen";
import ListingDetailScreen from "../features/listings/presentation/screens/ListingDetailScreen";
import MyListingsScreen from "../features/listings/presentation/screens/MyListingsScreen";
import { useNotifications } from "../features/notifications/presentation/context/NotificationsContext";
import NotificationsScreen from "../features/notifications/presentation/screens/NotificationsScreen";
import UserProfileScreen from "../features/profiles/presentation/screens/UserProfileScreen";
import { RootStackParamList, TabParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
function icon(name: IconName, focusedName: IconName) {
  function TabIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
    return <MaterialCommunityIcons name={focused ? focusedName : name} color={color} size={size} />;
  }
  return TabIcon;
}

// Las pestañas, para que las pruebas las toquen por clave.
export const HomeTabKeys = {
  catalog: "home.tab.catalog",
  mine: "home.tab.mine",
  chats: "home.tab.chats",
  notifications: "home.tab.notifications",
  profile: "home.tab.profile",
};

// La carcasa con la barra inferior. El catálogo es la primera pantalla y no
// pide sesión.
function Tabs() {
  const { unreadCount } = useNotifications();
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Catalog"
        component={CatalogScreen}
        options={{ title: "Carros en venta", tabBarLabel: "Carros", tabBarButtonTestID: HomeTabKeys.catalog, tabBarIcon: icon("car-outline", "car") }}
      />
      <Tab.Screen
        name="Mine"
        component={MyListingsScreen}
        options={{ title: "Lo mío", tabBarButtonTestID: HomeTabKeys.mine, tabBarIcon: icon("tag-outline", "tag") }}
      />
      <Tab.Screen name="Chats" component={ChatsScreen} options={{ title: "Chats", tabBarButtonTestID: HomeTabKeys.chats, tabBarIcon: icon("forum-outline", "forum") }} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: "Notificaciones",
          tabBarLabel: "Avisos",
          tabBarButtonTestID: HomeTabKeys.notifications,
          tabBarIcon: icon("bell-outline", "bell"),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Perfil", tabBarButtonTestID: HomeTabKeys.profile, tabBarIcon: icon("account-outline", "account") }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: "" }} />
      <Stack.Screen name="CreateListing" component={CreateListingScreen} options={{ title: "Publicar carro" }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "Chat" }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: "" }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Entrar", presentation: "modal" }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Crear cuenta" }} />
    </Stack.Navigator>
  );
}
