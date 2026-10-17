import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

// paste the JSON directly as objects
import darkColors from "./dark-colors.json";
import lightColors from "./light-colors.json";

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors, // keep defaults (surfaceDisabled, elevation, etc.)
    ...lightColors.colors,   // override with generator values
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors.colors,
  },
};