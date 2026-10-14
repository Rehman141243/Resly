import { ReactNode, useRef } from "react";
import { Animated, Pressable, View } from "react-native";

type Props = {
  children: ReactNode;
  className?: string;
  onPress?: () => void;
  scaleTo?: number;
};

export default function ScalePress({ children, className, onPress, scaleTo = 0.97 }: Props) {
  const s = useRef(new Animated.Value(1)).current;

  const to = (toValue: number) =>
    Animated.spring(s, { toValue, speed: 40, bounciness: 0, useNativeDriver: true }).start();

  return (
    <Pressable onPress={onPress} onPressIn={() => to(scaleTo)} onPressOut={() => to(1)}>
      <Animated.View style={{ transform: [{ scale: s }] }}>
        <View className={className}>{children}</View>
      </Animated.View>
    </Pressable>
  );
}