import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, PanResponder, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "./ThemeContext";

type ToastType = "success" | "error" | "info";

type ToastOptions = {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
};

type ToastItem = {
  id: number;
  title: string;
  message?: string;
  type: ToastType;
  duration: number;
};

type ToastContextType = {
  show: (opts: ToastOptions) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  hide: () => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

const OFFSCREEN = -160;

const ICON: Record<ToastType, { glyph: string; light: string; dark: string }> = {
  success: { glyph: "✓", light: "#34C759", dark: "#30D158" },
  error: { glyph: "✕", light: "#FF3B30", dark: "#FF453A" },
  info: { glyph: "i", light: "#3B82F6", dark: "#0A84FF" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { dark, colors } = useTheme();

  const [toast, setToast] = useState<ToastItem | null>(null);
  const idRef = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enter = useRef(new Animated.Value(OFFSCREEN)).current;
  const pan = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const hide = useCallback(() => {
    clearTimer();
    Animated.parallel([
      Animated.timing(enter, { toValue: OFFSCREEN, duration: 260, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        pan.setValue(0);
        setToast(null);
      }
    });
  }, [enter, opacity, pan]);

  const hideRef = useRef(hide);
  hideRef.current = hide;

  const show = useCallback((opts: ToastOptions) => {
    idRef.current += 1;
    setToast({
      id: idRef.current,
      title: opts.title,
      message: opts.message,
      type: opts.type ?? "info",
      duration: opts.duration ?? 2800,
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    clearTimer();
    enter.setValue(OFFSCREEN);
    pan.setValue(0);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(enter, {
        toValue: 0,
        damping: 16,
        stiffness: 180,
        mass: 0.9,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    timer.current = setTimeout(() => hideRef.current(), toast.duration);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.id]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
        onPanResponderGrant: clearTimer,
        onPanResponderMove: (_, g) => {
          pan.setValue(g.dy < 0 ? g.dy : g.dy * 0.15);
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy < -18 || g.vy < -0.5) {
            hideRef.current();
          } else {
            Animated.spring(pan, {
              toValue: 0,
              damping: 18,
              stiffness: 220,
              useNativeDriver: true,
            }).start();
            timer.current = setTimeout(() => hideRef.current(), 1800);
          }
        },
      }),
    [pan],
  );

  const value = useMemo<ToastContextType>(
    () => ({
      show,
      hide,
      success: (title, message) => show({ title, message, type: "success" }),
      error: (title, message) => show({ title, message, type: "error", duration: 3400 }),
      info: (title, message) => show({ title, message, type: "info" }),
    }),
    [show, hide],
  );

  const icon = toast ? ICON[toast.type] : ICON.info;
  const iconColor = dark ? icon.dark : icon.light;

  return (
    <ToastContext.Provider value={value}>
      {children}

      {toast ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: insets.top + 6,
            left: 0,
            right: 0,
            alignItems: "center",
            zIndex: 9999,
            elevation: 9999,
          }}
        >
          <Animated.View
            {...responder.panHandlers}
            style={{
              opacity,
              transform: [{ translateY: Animated.add(enter, pan) }],
              maxWidth: "90%",
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              paddingLeft: 12,
              paddingRight: 18,
              borderRadius: 999,
              backgroundColor: dark ? "rgba(44,44,46,0.97)" : "rgba(255,255,255,0.97)",
              borderWidth: 0.5,
              borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
              shadowColor: "#000",
              shadowOpacity: dark ? 0.5 : 0.14,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: iconColor,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", marginTop: -1 }}>
                {icon.glyph}
              </Text>
            </View>

            <Text
              numberOfLines={1}
              style={{
                flexShrink: 1,
                marginLeft: 10,
                color: colors.ink,
                fontSize: 15,
                fontFamily: "SFPRODISPLAYMEDIUM",
              }}
            >
              {toast.title}
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
