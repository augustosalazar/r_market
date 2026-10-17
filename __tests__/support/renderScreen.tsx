import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render } from "@testing-library/react-native";
import React from "react";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Container } from "@/src/core/di/container";
import { DIProvider } from "@/src/core/di/DIProvider";
import { SessionProvider } from "@/src/features/auth/presentation/context/SessionContext";
import { FollowsProvider } from "@/src/features/listings/presentation/context/FollowsContext";

// Lo que en Flutter era `GetMaterialApp(home: LaPantalla())`: una pantalla
// suelta con lo que necesita alrededor. En React Native eso es más cosas —el
// tema de Paper, el área segura, la navegación y los contextos que la pantalla
// lee—, así que va en un solo sitio.
export const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const Stack = createNativeStackNavigator();

export function renderScreen(screen: React.ComponentType<any>, container: Container) {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <DIProvider container={container}>
        <PaperProvider>
          <SessionProvider>
            <FollowsProvider>
              <NavigationContainer>
                <Stack.Navigator>
                  <Stack.Screen name="Screen" component={screen} />
                </Stack.Navigator>
              </NavigationContainer>
            </FollowsProvider>
          </SessionProvider>
        </PaperProvider>
      </DIProvider>
    </SafeAreaProvider>,
  );
}
