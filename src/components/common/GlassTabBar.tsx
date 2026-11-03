import { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon, { IconName } from "./Icon";
import { useTheme } from "../../context/ThemeContext";

const IS_IOS = Platform.OS === "ios";

const BlurView: any = IS_IOS ? require("@react-native-community/blur").BlurView : null;

const ICONS: Record<string, IconName> = {
  Home: "home",
  Resumes: "file-text",
  Templates: "layout",
  Profile: "user",
};

const BAR_H = 70;
const PAD = 6;

export function useTabBarInset() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12) - 2;
  return BAR_H + bottom + 16;
}

export default function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { dark, colors } = useTheme();
  const [barW, setBarW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;

  const count = state.routes.length;
  const tabW = barW > 0 ? (barW - PAD * 2) / count : 0;

  useEffect(() => {
    if (!tabW) return;
    Animated.spring(x, {
      toValue: state.index * tabW,
      useNativeDriver: true,
      speed: 18,
      bounciness: 7,
    }).start();
  }, [state.index, tabW, x]);

  const onLayout = (e: LayoutChangeEvent) => setBarW(e.nativeEvent.layout.width);

  const tint = IS_IOS
    ? dark
      ? "rgba(28,28,30,0.35)"
      : "rgba(255,255,255,0.35)"
    : dark
      ? "rgba(28,28,30,0.96)"
      : "rgba(255,255,255,0.96)";

  const edge = dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.14)";

  const pill = IS_IOS
    ? dark
      ? "rgba(255,255,255,0.09)"
      : "rgba(255,255,255,0.99)"
    : dark
      ? "rgba(255,255,255,0.12)"
      : "rgba(59,130,246,0.12)";

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 20,
        right: 20,
        bottom: Math.max(insets.bottom, 12) - 2,
      }}
    >
      <View
        onLayout={onLayout}
        style={{
          height: BAR_H,
          borderRadius: BAR_H / 2,
          shadowColor: "#000",
          shadowOpacity: dark ? 0.55 : 0.22,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 14,

          ...(IS_IOS ? null : { backgroundColor: dark ? "#1C1C1E" : "#FFFFFF" }),
        }}
      >
        <View style={[StyleSheet.absoluteFill, { borderRadius: BAR_H / 2, overflow: "hidden" }]}>
          {IS_IOS && BlurView ? (
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType={dark ? "ultraThinMaterialDark" : "ultraThinMaterialLight"}
              blurAmount={25}
              reducedTransparencyFallbackColor={dark ? "#2C2C2E" : "#FFFFFF"}
            />
          ) : null}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: BAR_H / 2,
              backgroundColor: "rgba(255,255,255,0.02)",
            }}
          />
        </View>

        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: BAR_H / 2, borderWidth: 1, borderColor: edge },
          ]}
        />

        {tabW > 0 ? (
          <Animated.View
            style={{
              position: "absolute",
              top: PAD,
              left: PAD,
              width: tabW,
              height: BAR_H - PAD * 2,
              borderRadius: (BAR_H - PAD * 2) / 2,
              backgroundColor: pill,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: edge,
              transform: [{ translateX: x }],
            }}
          />
        ) : null}

        <View style={{ flex: 1, flexDirection: "row", padding: PAD }}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const { options } = descriptors[route.key];

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented)
                navigation.navigate(route.name, route.params);
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
                style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
              >
                <Icon
                  name={ICONS[route.name] ?? "circle"}
                  size={22}
                  color={focused ? colors.brand : colors.muted}
                />
                <Text
                  style={{
                    marginTop: 3,
                    fontSize: 10.5,
                    fontWeight: "600",
                    color: focused ? colors.brand : colors.muted,
                  }}
                >
                  {typeof options.title === "string" ? options.title : route.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
