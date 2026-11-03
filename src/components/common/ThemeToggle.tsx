import { useEffect, useRef } from "react";
import { Animated, Pressable, View } from "react-native";
import Icon from "./Icon";
import { useTheme } from "../../context/ThemeContext";

const W = 72;
const H = 38;
const PAD = 3;
const KNOB = H - PAD * 2;
const TRAVEL = W - PAD * 2 - KNOB;

export default function ThemeToggle() {
  const { dark, toggleColorScheme } = useTheme();
  const progress = useRef(new Animated.Value(dark ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: dark ? 1 : 0,
      useNativeDriver: true,
      speed: 16,
      bounciness: 6,
    }).start();
  }, [dark, progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] });
  const nightOpacity = progress;
  const spin = progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Pressable
      onPress={toggleColorScheme}
      hitSlop={10}
      accessibilityRole="switch"
      accessibilityLabel="Dark mode"
      accessibilityState={{ checked: dark }}
      style={{ width: W, height: H }}
      className="overflow-hidden rounded-full border border-white/70 shadow-md shadow-black/30"
    >
      <View className="absolute inset-0 bg-[#BBD7FF]" />
      <Animated.View style={{ opacity: nightOpacity }} className="absolute inset-0 bg-[#111114]" />

      <View className="absolute inset-0 flex-row items-center justify-between px-[9px]">
        <Icon name="sun" size={16} color={dark ? "#F59E0B95" : "#FFFFFF"} />
        <Icon name="moon" size={16} color={dark ? "#9B9BA5" : "#7FA6E0"} />
      </View>

      <Animated.View
        style={{
          width: KNOB,
          height: KNOB,
          margin: PAD,
          transform: [{ translateX }, { rotate: spin }],
        }}
        className="items-center justify-center rounded-full bg-white shadow-md shadow-black/40"
      >
        <Icon name={dark ? "moon" : "sun"} size={17} color={dark ? "#3B82F6" : "#F59E0B"} />
      </Animated.View>
    </Pressable>
  );
}
