import { useCallback, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";

const KEY = "app.theme";

const palette = {
  light: {
    brand: "#3B82F6",
    ink: "#1B2559",
    muted: "#7A869F",
    line: "#DCE6F5",
    surface: "#00000050",
    canvas: "#DCE9FB",
    placeholder: "#A9B6CC",
    error: "#EF4444",
    icon: "#1B2559",

    bg: "#F2F2F7",
    card: "#FFFFFF",
    fill: "#F2F2F7",
    sep: "#C6C6C8",
    groupPlaceholder: "#C7C7CC",
  },
  dark: {
    brand: "#0A84FF",
    ink: "#FFFFFF",
    muted: "#FFFFFF90",
    line: "#3A3A3C",
    surface: "#1C1C1E",
    canvas: "#000000",
    placeholder: "#636366",
    error: "#FF453A",
    icon: "#8E8E93",
    bg: "#000000",
    card: "#1C1C1E",
    fill: "#2C2C2E",
    sep: "#38383A",
    groupPlaceholder: "#636366",
  },
};

export function useThemeBootstrap() {
  const { setColorScheme } = useColorScheme();
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === "light" || v === "dark") setColorScheme(v);
      })
      .catch(() => undefined);
  }, [setColorScheme]);
}

export function useTheme() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const dark = colorScheme === "dark";

  const toggleColorScheme = useCallback(() => {
    const next = dark ? "light" : "dark";
    setColorScheme(next);
    AsyncStorage.setItem(KEY, next).catch(() => undefined);
  }, [dark, setColorScheme]);

  return useMemo(
    () => ({
      dark,
      colors: dark ? palette.dark : palette.light,
      setColorScheme,
      toggleColorScheme,
    }),
    [dark, setColorScheme, toggleColorScheme],
  );
}
