import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";

const light = {
  bg: "#FAFAFA",
  card: "#FFFFFF",
  ink: "#111111",
  muted: "#8A8A8E",
  line: "#E6E6E9",
  accent: "#111111",
  onAccent: "#FFFFFF",
};
const dark: typeof light = {
  bg: "#0B0B0C",
  card: "#151517",
  ink: "#F5F5F7",
  muted: "#8E8E93",
  line: "#2A2A2E",
  accent: "#F5F5F7",
  onAccent: "#111111",
};
type Theme = typeof light;

const STEPS = [
  "Reading your resume",
  "Matching keywords",
  "Checking formatting",
  "Reviewing wording and impact",
];
const STAGE_AT = [0.18, 0.42, 0.66, 0.85];

const PROGRESS_CAP = 0.94;
const SCAN_MS = 2400;

type Bar = { y: number; w: number; h: number; x?: number; strong?: boolean };

const buildLayout = (W: number) => {
  const pad = Math.round(W * 0.08);
  const inner = W - pad * 2;
  const bars: Bar[] = [];
  let y = pad;

  bars.push({ y, w: inner * 0.5, h: 8, strong: true });
  y += 8 + 7;
  bars.push({ y, w: inner * 0.32, h: 4 });
  y += 4 + 16;

  const blocks = [
    [0.96, 0.88, 0.6],
    [0.92, 0.8, 0.94, 0.5],
    [0.9, 0.7, 0.86],
    [0.7, 0.55],
  ];
  blocks.forEach((lines) => {
    bars.push({ y, w: inner * 0.28, h: 5, strong: true });
    y += 5 + 9;
    lines.forEach((lw) => {
      bars.push({ y, w: inner * lw, h: 4 });
      y += 4 + 7;
    });
    y += 9;
  });

  return { bars, pad, height: y + pad - 9 };
};

const InkBar = memo(function InkBar({
  t,
  bar,
  frac,
  scan,
  left,
  still,
}: {
  t: Theme;
  bar: Bar;
  frac: number;
  scan: Animated.Value;
  left: number;
  still: boolean;
}) {
  const a = Math.max(0, frac - 0.06);
  const b = Math.min(0.995, frac + 0.02);
  const ink = still
    ? 0.55
    : scan.interpolate({
        inputRange: [a, b > a ? b : a + 0.01],
        outputRange: [0, bar.strong ? 0.9 : 0.5],
        extrapolate: "clamp",
      });
  return (
    <View
      style={{
        position: "absolute",
        left,
        top: bar.y,
        width: bar.w,
        height: bar.h,
        borderRadius: bar.h / 2,
        backgroundColor: t.line,
        overflow: "hidden",
      }}
    >
      <Animated.View style={{ flex: 1, backgroundColor: t.ink, opacity: ink as any }} />
    </View>
  );
});

const Tick = memo(function Tick({ t }: { t: Theme }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, friction: 6, tension: 160, useNativeDriver: true }).start();
  }, [v]);
  return (
    <Animated.View style={[st.tick, { backgroundColor: t.accent, transform: [{ scale: v }] }]}>
      <Text style={[st.tickText, { color: t.onAccent }]}>✓</Text>
    </Animated.View>
  );
});

const Pulse = memo(function Pulse({ t }: { t: Theme }) {
  const v = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [v]);
  return <Animated.View style={[st.pulse, { backgroundColor: t.ink, opacity: v }]} />;
});

function StepRow({
  t,
  label,
  state,
}: {
  t: Theme;
  label: string;
  state: "done" | "active" | "pending";
}) {
  return (
    <View style={st.stepRow}>
      <View style={st.stepIcon}>
        {state === "done" ? (
          <Tick t={t} />
        ) : state === "active" ? (
          <Pulse t={t} />
        ) : (
          <View style={[st.pending, { borderColor: t.line }]} />
        )}
      </View>
      <Text
        style={[
          st.stepLabel,
          { color: state === "pending" ? t.muted : t.ink },
          state === "active" && { fontWeight: "600" },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ResumeAnalyzing({
  done = false,
  onComplete,
}: {
  done?: boolean;
  onComplete?: () => void;
}) {
  const scheme = useColorScheme();
  const t = scheme === "dark" ? dark : light;
  const { width: winW } = useWindowDimensions();

  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [{ pct, stage }, setProg] = useState({ pct: 0, stage: 0 });

  const W = Math.round(Math.min(winW * 0.6, 240));
  const { bars, pad, height: H } = useMemo(() => buildLayout(W), [W]);

  const scan = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const finished = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false));
  }, []);

  useEffect(() => {
    if (reduceMotion === null) return;
    Animated.spring(enter, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, {
          toValue: 1,
          duration: SCAN_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(350),
        Animated.timing(scan, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, scan, enter]);

  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      const p = Math.round(value * 100);
      const s = STAGE_AT.filter((x) => value >= x).length;
      setProg((prev) => (prev.pct === p && prev.stage === s ? prev : { pct: p, stage: s }));
    });
    const anim = Animated.timing(progress, {
      toValue: PROGRESS_CAP,
      duration: 28000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start();
    return () => {
      anim.stop();
      progress.removeListener(id);
    };
  }, [progress]);

  useEffect(() => {
    if (!done || finished.current) return;
    finished.current = true;
    progress.stopAnimation();
    Animated.timing(progress, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start(() => onComplete?.());
  }, [done, onComplete, progress]);

  const beamY = scan.interpolate({ inputRange: [0, 1], outputRange: [0, H] });
  const complete = pct >= 100;
  const headline = complete
    ? "Analysis complete"
    : stage >= STEPS.length
      ? "Almost done"
      : STEPS[stage];
  const still = !!reduceMotion;

  return (
    <View
      style={[st.screen, { backgroundColor: t.bg }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Analyzing your resume"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
    >
      <Animated.View
        style={{
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
          ],
        }}
      >
        <View
          style={[st.paper, { width: W, height: H, backgroundColor: t.card, borderColor: t.line }]}
        >
          {bars.map((b, i) => (
            <InkBar key={i} t={t} bar={b} frac={b.y / H} scan={scan} left={pad} still={still} />
          ))}

          {!still && (
            <Animated.View
              pointerEvents="none"
              style={[st.beamWrap, { transform: [{ translateY: beamY }] }]}
            >
              <View style={[st.beamGlow, { backgroundColor: t.ink }]} />
              <View style={[st.beamLine, { backgroundColor: t.ink }]} />
            </Animated.View>
          )}
        </View>
      </Animated.View>

      <Text style={[st.pct, { color: t.ink }]}>{pct}%</Text>
      <Text style={[st.headline, { color: t.muted }]}>
        {headline}
        {complete ? "" : "..."}
      </Text>

      <View style={[st.track, { backgroundColor: t.line }]}>
        <Animated.View
          style={[
            st.fill,
            {
              backgroundColor: t.accent,
              width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
            },
          ]}
        />
      </View>

      <View style={st.steps}>
        {STEPS.map((label, i) => (
          <StepRow
            key={label}
            t={t}
            label={label}
            state={complete || i < stage ? "done" : i === stage ? "active" : "pending"}
          />
        ))}
      </View>

      <Text style={[st.foot, { color: t.muted }]}>This takes about 20 to 30 seconds.</Text>
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },

  paper: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 4,
  },
  beamWrap: { position: "absolute", left: 0, right: 0, top: -30, height: 30 },
  beamGlow: { position: "absolute", left: 0, right: 0, top: 0, height: 28, opacity: 0.05 },
  beamLine: { position: "absolute", left: 0, right: 0, bottom: 0, height: 1.5, opacity: 0.85 },

  pct: { marginTop: 32, fontSize: 40, fontWeight: "700", letterSpacing: -1 },
  headline: { marginTop: 4, fontSize: 15 },

  track: { marginTop: 20, width: 220, height: 3, borderRadius: 2, overflow: "hidden" },
  fill: { height: 3, borderRadius: 2 },

  steps: { marginTop: 24, alignSelf: "center", width: 260 },
  stepRow: { flexDirection: "row", alignItems: "center", height: 32 },
  stepIcon: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  stepLabel: { marginLeft: 10, fontSize: 14 },
  tick: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  tickText: { fontSize: 10, fontWeight: "800" },
  pulse: { width: 8, height: 8, borderRadius: 4 },
  pending: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5 },

  foot: { marginTop: 22, fontSize: 12 },
});
