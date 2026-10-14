import { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "@react-native-community/blur";

export default function GlassCard({ children }: { children: ReactNode }) {
  const isIOS = Platform.OS === "ios";

  return (
    <View className="overflow-hidden rounded-[32px] border border-white/40">
      {isIOS ? (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="light"
          blurAmount={25}
          reducedTransparencyFallbackColor="#DDDBCB"
        />
      ) : null}
      {/* Android has no reliable native blur, so it gets a slightly stronger tint instead */}
      <View className={`p-6 ${isIOS ? "bg-white/15" : "bg-white/25"}`}>{children}</View>
    </View>
  );
}