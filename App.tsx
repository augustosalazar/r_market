import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";

import { Container } from "./src/core/di/container";
import { DIProvider } from "./src/core/di/DIProvider";
import { SnackbarProvider } from "./src/core/feedback/SnackbarProvider";
import { MissingConfigScreen } from "./src/core/roble/MissingConfigScreen";
import { createLocalContainer } from "./src/core/di/localContainer";
import { missingRobleConfig, useLocalData } from "./src/core/roble/robleConfig";
import { SessionProvider, useSession } from "./src/features/auth/presentation/context/SessionContext";
import { FollowsProvider } from "./src/features/listings/presentation/context/FollowsContext";
import { NotificationsProvider } from "./src/features/notifications/presentation/context/NotificationsContext";
import { navigationRef } from "./src/navigation/navigationRef";
import RootNavigator from "./src/navigation/RootNavigator";
import { darkTheme, lightTheme } from "./src/theme/theme";

// Expo Go doesn't support customizing the splash screen; only apply options in development/production builds.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Keep the native splash screen visible until the app has finished loading.
SplashScreen.preventAutoHideAsync();
if (!isExpoGo) {
  SplashScreen.setOptions({ duration: 400, fade: true });
}

// Con datos en memoria se crea una sola vez: es el «servidor» de esta corrida.
const localContainer = useLocalData ? createLocalContainer() : undefined;

export default function App() {
  return <AppRoot container={localContainer} />;
}

// `container` lets tests swap the Roble data sources for fakes.
export function AppRoot({ container }: { container?: Container }) {
  const [fontsReady, setFontsReady] = useState(false);
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? darkTheme : lightTheme;
  // Sin `.env` no hay a qué servidor conectarse: mejor decirlo en pantalla que
  // fallar después con un error de red que no explica nada.
  const missing = container ? [] : missingRobleConfig();

  useEffect(() => {
    // Paper draws its icons with MaterialCommunityIcons, so preload that font.
    Font.loadAsync(MaterialCommunityIcons.font)
      .catch((e) => console.warn(e))
      .finally(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    if (fontsReady && missing.length > 0) SplashScreen.hide();
  }, [fontsReady, missing.length]);

  if (!fontsReady) return null;

  if (missing.length > 0) {
    return (
      <PaperProvider theme={theme}>
        <MissingConfigScreen missing={missing} />
      </PaperProvider>
    );
  }

  const navigationTheme = {
    ...(scheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.outlineVariant,
      primary: theme.colors.primary,
      notification: theme.colors.error,
    },
  };

  return (
    <DIProvider container={container}>
      <PaperProvider theme={theme}>
        <SnackbarProvider>
          <SessionProvider>
            <FollowsProvider>
              <NotificationsProvider>
                <NavigationContainer ref={navigationRef} theme={navigationTheme}>
                  <Shell />
                </NavigationContainer>
              </NotificationsProvider>
            </FollowsProvider>
          </SessionProvider>
        </SnackbarProvider>
      </PaperProvider>
    </DIProvider>
  );
}

// The splash stays up until the saved session has been restored, so the first
// screen already knows who is inside.
function Shell() {
  const { ready } = useSession();
  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);
  return ready ? <RootNavigator /> : null;
}
