import { ReactNode, useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

export default function Reveal({ index = 0, children }: { index?: number; children: ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 480,
      delay: index * 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, v]);

  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}