import { useColorScheme } from "nativewind";

// Keep in sync with tailwind.config.js
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
  },
};

export function useTheme() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme();
  const dark = colorScheme === "dark";
  return { dark, colors: dark ? palette.dark : palette.light, setColorScheme, toggleColorScheme };
}