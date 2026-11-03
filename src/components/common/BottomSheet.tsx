import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "./Icon";

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

export default function BottomSheet({ visible, title, subtitle, onClose, children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1 justify-end"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable className="absolute inset-0 bg-black/50" onPress={onClose} />

        <View
          style={{ maxHeight: "88%" }}
          className="rounded-t-[28px] bg-surface dark:bg-surface-dark"
        >
          <View className="items-center pt-3">
            <View className="h-1 w-10 rounded-full bg-line dark:bg-line-dark" />
          </View>

          <View className="flex-row items-start px-6 pb-4 pt-4">
            <View className="flex-1 pr-3">
              <Text className="text-xl font-bold tracking-tight text-ink dark:text-ink-dark">
                {title}
              </Text>
              {subtitle ? (
                <Text className="mt-1 text-sm text-muted dark:text-muted-dark">{subtitle}</Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              className="h-9 w-9 items-center justify-center rounded-full border border-line active:opacity-60 dark:border-line-dark"
            >
              <Icon name="x" size={18} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
