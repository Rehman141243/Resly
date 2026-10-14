import { ReactNode } from "react";
import {
  ImageBackground,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "../constant/icon";
import { useTheme } from "../context/ThemeContext";

type Props = {
  title: string;
  subtitle: string;
  onBack?: () => void;
  /** Floats in the top-right corner of the hero (e.g. the theme toggle). */
  headerRight?: ReactNode;
  footer?: ReactNode;
  /** Hero image (light mode). Gives the hero layout: image on top, sheet below. */
  background?: ImageSourcePropType;
  /** Optional separate hero image for dark mode. If omitted, the light one is dimmed. */
  backgroundDark?: ImageSourcePropType;
  children: ReactNode;
};

export default function AuthLayout({
  title,
  subtitle,
  onBack,
  headerRight,
  footer,
  background,
  backgroundDark,
  children,
}: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { dark, colors } = useTheme();
  const barStyle = dark ? "light-content" : "dark-content";

  /* ---------- Hero layout: image on top, rounded sheet over it ---------- */
  if (background) {
    const heroH = Math.min(width * 0.9, height * 0.38);
    const source = dark && backgroundDark ? backgroundDark : background;
    const dim = dark && !backgroundDark;

    return (
      <View className="flex-1 bg-canvas dark:bg-canvas-dark">
        <StatusBar barStyle={barStyle} />

        <ImageBackground
          source={source}
          resizeMode="cover"
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: heroH + 30 }}
        >
          {dim ? <View className="flex-1 bg-black/20" /> : null}
        </ImageBackground>

        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentContainerClassName="grow"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={{ height: heroH }} />

            <View className="grow rounded-t-[32px] bg-surface px-6 pb-8 pt-9 dark:bg-surface-dark">
              <Text className="text-center text-2xl font-bold tracking-tight text-ink dark:text-ink-dark">
                {title}
              </Text>
              <Text className="mb-8 mt-2 text-center text-base text-muted dark:text-muted-dark">{subtitle}</Text>

              {children}

              {footer ? <View className="mt-auto items-center pt-8">{footer}</View> : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={10}
            style={{ position: "absolute", top: insets.top + 8, left: 20 }}
            className="h-11 w-11 items-center justify-center rounded-full bg-white/80 active:opacity-60 dark:bg-black/50"
          >
            <Icon name="arrow-left" size={20} color={dark ? "#FFFFFF" : colors.ink} />
          </Pressable>
        ) : null}

        {headerRight ? (
          <View style={{ position: "absolute", top: insets.top + 11, right: 20 }}>{headerRight}</View>
        ) : null}
      </View>
    );
  }

  /* ---------- Plain layout (no image) ---------- */
  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <StatusBar barStyle={barStyle} />

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <SafeAreaView className="flex-1">
          <ScrollView
            contentContainerClassName="grow px-6 pb-8 pt-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="h-11 flex-row items-center justify-between">
              {onBack ? (
                <Pressable
                  onPress={onBack}
                  hitSlop={10}
                  className="h-11 w-11 items-center justify-center rounded-full border border-line active:opacity-60 dark:border-line-dark"
                >
                  <Icon name="arrow-left" size={20} color={colors.ink} />
                </Pressable>
              ) : (
                <View className="w-11" />
              )}
              <Text className="text-xl font-bold tracking-tight text-ink dark:text-ink-dark">
                Fit<Text className="text-brand dark:text-brand-dark">Connect</Text>
              </Text>
              <View className="w-11">{headerRight}</View>
            </View>

            <View className="mt-12">
              <Text className="text-3xl font-bold tracking-tight text-ink dark:text-ink-dark">{title}</Text>
              <Text className="mb-9 mt-2 text-base leading-6 text-muted dark:text-muted-dark">{subtitle}</Text>
              {children}
            </View>

            {footer ? <View className="mt-auto items-center pt-8">{footer}</View> : null}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}