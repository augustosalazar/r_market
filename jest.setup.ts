import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import "react-native-gesture-handler/jestSetup";

console.log("✅ Jest setup file loaded successfully");

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

jest.mock("react-native-gesture-handler", () =>
  jest.requireActual("react-native-gesture-handler"),
);
