import { ActivityIndicator, Image, Text, View } from "react-native";

type Props = {
  uri?: string | null;
  initials: string;
  size?: number;
  loading?: boolean;
};

export default function Avatar({ uri, initials, size = 64, loading }: Props) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center overflow-hidden bg-brand dark:bg-brand-dark"
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Text style={{ fontSize: size * 0.38 }} className="font-bold text-white">
          {initials}
        </Text>
      )}

      {loading ? (
        <View className="absolute inset-0 items-center justify-center bg-black/40">
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );
}
