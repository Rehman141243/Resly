import { ScrollView, StatusBar, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import ScalePress from "../../components/common/ScalePress";
import ThemeToggle from "../../components/common/ThemeToggle";
import Icon from "../../constant/icon";
import Reveal from "../../components/common/Reveal";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { dark } = useTheme();
  const { user, signOut } = useAuth() as {
    user?: { name?: string; email?: string } | null;
    signOut: () => void | Promise<void>;
  };

  const name = user?.name ?? "FitConnect member";

  return (
    <View className="flex-1 bg-[#F4F7FC] dark:bg-canvas-dark">
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 32 }}
      >
        <Reveal index={0}>
          <Text className="px-6 text-[32px] font-bold tracking-tight text-ink dark:text-ink-dark">Profile</Text>

          <View className="mx-6 mt-5 flex-row items-center rounded-[20px] bg-surface p-4 dark:bg-surface-dark">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-brand dark:bg-brand-dark">
              <Text className="text-2xl font-bold text-white">{name.charAt(0).toUpperCase()}</Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-bold text-ink dark:text-ink-dark">{name}</Text>
              {user?.email ? (
                <Text className="mt-0.5 text-sm text-muted dark:text-muted-dark">{user.email}</Text>
              ) : null}
            </View>
          </View>
        </Reveal>

        <Reveal index={1}>
          <View className="mx-6 mt-5 overflow-hidden rounded-[20px] bg-surface dark:bg-surface-dark">
            <View className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-row items-center">
                <Icon name={dark ? "moon" : "sun"} size={20} />
                <Text className="ml-3 text-base text-ink dark:text-ink-dark">Appearance</Text>
              </View>
              <ThemeToggle />
            </View>
          </View>

          <View className="mx-6 mt-5 overflow-hidden rounded-[20px] bg-surface dark:bg-surface-dark">
            <ScalePress scaleTo={0.985} onPress={() => signOut()} className="flex-row items-center px-4 py-4">
              <Icon name="log-out" size={20} color="#EF4444" />
              <Text className="ml-3 text-base font-semibold text-red-500 dark:text-[#FF453A]">Log out</Text>
            </ScalePress>
          </View>
        </Reveal>
      </ScrollView>
    </View>
  );
}