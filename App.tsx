
import { useEffect } from "react";
import "./global.css";

import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { ToastProvider } from "./src/context/ToastContext";
import { useThemeBootstrap } from "./src/context/ThemeContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { initAds } from "./src/services/rewardedAds";

export default function App() {
  useThemeBootstrap();

  useEffect(() => {
    initAds().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}