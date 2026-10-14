import { useEffect, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "@react-native-community/blur";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon, { IconName } from "../../constant/icon";
import { useTheme } from "../../context/ThemeContext";

const ICONS: Record<string, IconName> = {
  Home: "home",
  Resumes: "file-text",
  Templates: "layout",
  Profile: "user",
};

const BAR_H = 70;
const PAD = 6;

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

  // glass tint, edge and active pill
  const tint = dark ? "rgba(28,28,30,0.35)" : "rgba(255,255,255,0.35)";
  const edge = dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.14)";
  const pill = dark ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.99)";

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
        }}
      >
        {/* glass layer */}
        <View style={[StyleSheet.absoluteFill, { borderRadius: BAR_H / 2, overflow: "hidden" }]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType={dark ? "ultraThinMaterialDark" : "ultraThinMaterialLight"}
            blurAmount={25}
            // overlayColor="transparent"
            reducedTransparencyFallbackColor={dark ? "#2C2C2E" : "#FFFFFF"}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
          {/* top shine */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: BAR_H / 2,
              backgroundColor: dark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.02)",
            }}
          />
        </View>

        {/* glass edge */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: BAR_H / 2, borderWidth: 1, borderColor: edge },
          ]}
        />

        {/* sliding pill */}
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

        {/* tabs */}
        <View style={{ flex: 1, flexDirection: "row", padding: PAD }}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const { options } = descriptors[route.key];

            const onPress = () => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
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