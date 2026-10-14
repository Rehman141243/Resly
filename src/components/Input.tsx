import { useRef, useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import Icon, { IconName } from "../constant/icon";
import { useTheme } from "../context/ThemeContext";

type Props = TextInputProps & {
  label: string;
  icon: IconName;
  error?: string;
  /** Shows an (x) button when there is text. Pass it to enable. */
  onClear?: () => void;
};

export default function Input({
  label,
  icon,
  error,
  onClear,
  secureTextEntry,
  value,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const { dark, colors } = useTheme();
  const ref = useRef<TextInput>(null);
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const [focused, setFocused] = useState(false);

  const border = error
    ? "border-red-500 dark:border-[#FF453A]"
    : focused
      ? "border-brand dark:border-brand-dark"
      : "border-line dark:border-line-dark";
  const iconColor = error ? colors.error : focused ? colors.brand : colors.icon;

  return (
    <View className="mb-4">
      <Pressable
        onPress={() => ref.current?.focus()}
        className={`h-[68px] flex-row items-center rounded-2xl border bg-field px-4 dark:bg-field-dark ${border}`}
      >
        <Icon name={icon} size={22} color={iconColor} />
        <View className="mx-3 h-8 w-px bg-line dark:bg-line-dark" />

        <View className="flex-1 justify-center">
          <Text className="text-xs text-muted dark:text-muted-dark">{label}</Text>
          <TextInput
            ref={ref}
            value={value}
            className="p-0 pt-0.5 text-base font-medium text-ink dark:text-ink-dark"
            placeholderTextColor={colors.placeholder}
            keyboardAppearance={dark ? "dark" : "light"}
            selectionColor={colors.brand}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={hidden}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...rest}
          />
        </View>

        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={12} className="pl-2">
            <Icon name={hidden ? "eye-off" : "eye"} size={20} />
          </Pressable>
        ) : onClear && value ? (
          <Pressable onPress={onClear} hitSlop={12} className="pl-2">
            <Icon name="x-circle" size={20} />
          </Pressable>
        ) : null}
      </Pressable>

      {error ? <Text className="ml-1 mt-1.5 text-sm text-red-500 dark:text-[#FF453A]">{error}</Text> : null}
    </View>
  );
}