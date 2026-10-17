import { NavigatorScreenParams } from "@react-navigation/native";

// Screens inside the bottom tabs.
export type TabParamList = {
  Catalog: undefined;
  Mine: undefined;
  Chats: undefined;
  Notifications: undefined;
  Profile: undefined;
};

// Screens in the root stack.
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  ListingDetail: { listingId: string };
  CreateListing: undefined;
  Chat: { threadId: string };
  // Viaja el nombre junto al id: no hay forma de leer el perfil de otra persona,
  // los nombres salen denormalizados de las filas.
  UserProfile: { userId: string; name: string };
  Login: undefined;
  Register: undefined;
};

// Makes useNavigation() / navigation.navigate() type-checked across the app.
declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
