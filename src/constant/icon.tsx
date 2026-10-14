import Feather from "react-native-vector-icons/Feather";
import { useTheme } from "../context/ThemeContext";

export type IconName = React.ComponentProps<typeof Feather>["name"];

type Props = { name: IconName; size?: number; color?: string };

export default function Icon({ name, size = 20, color }: Props) {
  const { colors } = useTheme();
  return <Feather name={name} size={size} color={color ?? colors.icon} />;
}