import { ActivityIndicator, Pressable, Text } from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "ghost";
};

export default function Button({ title, onPress, loading, variant = "primary" }: Props) {
  const primary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className={`h-14 items-center justify-center rounded-2xl active:opacity-80 ${
        primary ? "bg-brand" : "border border-line bg-white"
      } ${loading ? "opacity-70" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color={primary ? "#FFFFFF" : "#E5703A"} />
      ) : (
        <Text className={`text-base font-semibold ${primary ? "text-white" : "text-ink"}`}>{title}</Text>
      )}
    </Pressable>
  );
}