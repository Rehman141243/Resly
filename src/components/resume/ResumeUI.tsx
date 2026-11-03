import { Children, Fragment, ReactNode, useMemo } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

export function useResumeColors() {
  const { dark, colors } = useTheme();
  return useMemo(
    () => ({
      dark,
      brand: colors.brand,
      ink: colors.ink,
      muted: colors.muted,
      error: colors.error,
      bg: colors.bg,
      card: colors.card,
      fill: colors.fill,
      sep: colors.sep,
      placeholder: colors.groupPlaceholder,
      line: "#C7C7CC",
    }),
    [dark, colors],
  );
}

export function NavText({
  label,
  onPress,
  bold,
  disabled,
}: {
  label: string;
  onPress: () => void;
  bold?: boolean;
  disabled?: boolean;
}) {
  const c = useResumeColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.4}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <Text style={{ color: c.brand, fontSize: 17, fontWeight: bold ? "600" : "400" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function NavBar({
  title,
  onBack,
  backLabel = "Back",
  right,
}: {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  right?: ReactNode;
}) {
  const c = useResumeColors();
  return (
    <View style={{ height: 44, flexDirection: "row", alignItems: "center", paddingHorizontal: 8 }}>
      <View style={{ flex: 1, alignItems: "flex-start" }}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.4}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Text style={{ color: c.brand, fontSize: 32, lineHeight: 34, marginRight: 3 }}>‹</Text>
            <Text style={{ color: c.brand, fontSize: 17 }}>{backLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text
        numberOfLines={1}
        style={{ flex: 2, textAlign: "center", fontSize: 17, fontWeight: "600", color: c.ink }}
      >
        {title}
      </Text>
      <View style={{ flex: 1, alignItems: "flex-end", paddingRight: 8 }}>{right}</View>
    </View>
  );
}

export const Sep = ({ inset = 16 }: { inset?: number }) => {
  const c = useResumeColors();
  return (
    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.sep, marginLeft: inset }} />
  );
};

export function Group({ children, style }: { children: ReactNode; style?: object }) {
  const c = useResumeColors();
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={[{ backgroundColor: c.card, borderRadius: 12, overflow: "hidden" }, style]}>
      {items.map((ch, i) => (
        <Fragment key={i}>
          {i > 0 ? <Sep /> : null}
          {ch}
        </Fragment>
      ))}
    </View>
  );
}

export function Caption({ children }: { children: ReactNode }) {
  const c = useResumeColors();
  return (
    <Text
      style={{
        fontSize: 13,
        color: c.muted,
        marginHorizontal: 20,
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: 0.3,
      }}
    >
      {children}
    </Text>
  );
}

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = "primary",
  style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  style?: object;
}) {
  const c = useResumeColors();
  const primary = variant === "primary";
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          height: 50,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: primary ? c.brand : c.card,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? "#FFFFFF" : c.brand} />
      ) : (
        <Text style={{ fontSize: 17, fontWeight: "600", color: primary ? "#FFFFFF" : c.brand }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function CenterState({
  loading,
  message,
  onRetry,
}: {
  loading?: boolean;
  message?: string;
  onRetry?: () => void;
}) {
  const c = useResumeColors();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      {loading ? (
        <ActivityIndicator size="large" color={c.brand} />
      ) : (
        <>
          <Text style={{ color: c.muted, fontSize: 15, textAlign: "center", marginBottom: 16 }}>
            {message}
          </Text>
          {onRetry ? (
            <Button label="Try again" onPress={onRetry} style={{ paddingHorizontal: 32 }} />
          ) : null}
        </>
      )}
    </View>
  );
}

export type SheetAction = { label: string; onPress: () => void; destructive?: boolean };

export function Sheet({
  visible,
  title,
  actions,
  onClose,
}: {
  visible: boolean;
  title?: string;
  actions: SheetAction[];
  onClose: () => void;
}) {
  const c = useResumeColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}} style={{ padding: 10, paddingBottom: insets.bottom + 10 }}>
          <View style={{ backgroundColor: c.card, borderRadius: 14, overflow: "hidden" }}>
            {title ? (
              <Text
                style={{ textAlign: "center", fontSize: 13, color: c.muted, paddingVertical: 14 }}
              >
                {title}
              </Text>
            ) : null}
            <ScrollView style={{ maxHeight: 360 }} bounces={false}>
              {actions.map((a, i) => (
                <Fragment key={a.label}>
                  {i > 0 || title ? <Sep inset={0} /> : null}
                  <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={() => {
                      onClose();
                      a.onPress();
                    }}
                    style={{ height: 54, alignItems: "center", justifyContent: "center" }}
                  >
                    <Text style={{ fontSize: 20, color: a.destructive ? c.error : c.brand }}>
                      {a.label}
                    </Text>
                  </TouchableOpacity>
                </Fragment>
              ))}
            </ScrollView>
          </View>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={onClose}
            style={{
              marginTop: 8,
              height: 56,
              borderRadius: 14,
              backgroundColor: c.card,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "600", color: c.brand }}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function Header({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const c = useResumeColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
      }}
    >
      <TouchableOpacity
        onPress={onBack}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={{ width: 70 }}
      >
        <Text style={{ color: c.brand, fontSize: 17 }}>‹ Back</Text>
      </TouchableOpacity>
      <Text
        numberOfLines={1}
        style={{ flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", color: c.ink }}
      >
        {title}
      </Text>
      <View style={{ width: 70, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}
