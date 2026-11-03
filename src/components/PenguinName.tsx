import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { SvgXml } from "react-native-svg";
import { useTheme } from "../context/ThemeContext";
import {
  ARM_POSE,
  BODY_LEFT,
  BODY_RIGHT,
  BODY_TOP,
  CENTER,
  EYE_PIVOT_Y,
  FEET_PIVOT,
  FRAME,
  GROUND,
  HAND_PULL,
  PULL_LEAN,
  REST_LEAN,
  SHOULDER_LEFT,
  SHOULDER_RIGHT,
  TAIL_PIVOT,
  penguinArt,
  wrap,
} from "./PenguinArt";

let hasPlayed = false;

type AnyAnim = any;

const deg = (v: AnyAnim) =>
  v.interpolate({ inputRange: [-180, 180], outputRange: ["-180deg", "180deg"] });

const Art = memo(function Art({ xml, w, h }: { xml: string; w: number; h: number }) {
  return <SvgXml xml={xml} width={w} height={h} />;
});

type Props = {
  name: string;
  playOnce?: boolean;
  bleed?: number;
  size?: number;
  scarf?: boolean;
  scarfColor?: string;
};

const START_X = 30;
const SHADOW_Y = 135;

export default function PenguinName({
  name,
  playOnce = true,
  bleed = 24,
  size = 40,
  scarf = true,
  scarfColor,
}: Props) {
  const { dark } = useTheme();
  const { width: winW } = useWindowDimensions();
  const skip = playOnce && hasPlayed;

  const isFocused = useIsFocused();
  const focusedRef = useRef(isFocused);
  focusedRef.current = isFocused;

  const k = size / 140;
  const FW = FRAME.w * k;
  const FH = FRAME.h * k;
  const contW = (BODY_RIGHT - BODY_LEFT) * k;
  const contH = (GROUND - BODY_TOP) * k;
  const frameLeft = (FRAME.x - BODY_LEFT) * k;
  const frameTop = (FRAME.y - BODY_TOP) * k;

  const GAP = 3;
  const LAG = Math.round(size * 0.95);
  const ROPE_H = 4;
  const handDx = (HAND_PULL.x + 3 - BODY_LEFT) * k;
  const ROPE_W = Math.max(8, GAP + LAG + handDx);
  const ROPE_BOTTOM = (GROUND - HAND_PULL.y) * k - ROPE_H / 2;
  const JUMP_PX = size * 0.4;

  const pivot = (px: number, py: number, rotate: AnyAnim) => [
    { translateX: (px - CENTER.x) * k },
    { translateY: (py - CENTER.y) * k },
    { rotate },
    { translateX: -(px - CENTER.x) * k },
    { translateY: -(py - CENTER.y) * k },
  ];

  const art = useMemo(() => {
    const a = penguinArt(dark, { scarf, brand: scarfColor });
    return {
      shadow: wrap(a.shadow),
      footLeft: wrap(a.footLeft),
      footRight: wrap(a.footRight),
      torso: wrap(a.torso),
      eyes: wrap(a.eyes),
      scarfTail: a.scarfTail ? wrap(a.scarfTail) : "",
      flipperLeft: wrap(a.flipperLeft),
      flipperRight: wrap(a.flipperRight),
    };
  }, [dark, scarf, scarfColor]);

  const run = useRef(new Animated.Value(skip ? 1 : 0)).current;
  const stretch = useRef(new Animated.Value(0)).current;
  const walk = useRef(new Animated.Value(0.5)).current;
  const lean = useRef(new Animated.Value(skip ? REST_LEAN : 0)).current;
  const arms = useRef(new Animated.Value(skip ? 1 : 0)).current;
  const blink = useRef(new Animated.Value(0)).current;
  const idle = useRef(new Animated.Value(0)).current;
  const jump = useRef(new Animated.Value(0)).current;
  const cheer = useRef(new Animated.Value(0)).current;
  const wave = useRef(new Animated.Value(0)).current;

  const [w, setW] = useState(0);
  const started = useRef(false);
  const idleStarted = useRef(false);
  const busy = useRef(false);
  const funTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const funCount = useRef(0);
  const running = useRef<Animated.CompositeAnimation[]>([]);

  const onLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width;
    setW((prev) => (Math.abs(prev - next) > 0.5 ? next : prev));
  };

  const track = useCallback((a: Animated.CompositeAnimation) => {
    running.current.push(a);
    return a;
  }, []);

  const playCheer = useCallback(() => {
    if (busy.current || !idleStarted.current) return;
    busy.current = true;
    track(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(jump, {
            toValue: -0.2,
            duration: 130,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(jump, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(jump, {
            toValue: 0,
            duration: 260,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(jump, { toValue: -0.12, duration: 80, useNativeDriver: true }),
          Animated.spring(jump, { toValue: 0, friction: 4, tension: 140, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(130),
          Animated.timing(cheer, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.delay(300),
          Animated.timing(cheer, {
            toValue: 0,
            duration: 320,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start(() => {
      busy.current = false;
    });
  }, [jump, cheer, track]);

  const playWave = useCallback(() => {
    if (busy.current || !idleStarted.current) return;
    busy.current = true;
    const shake = [0.82, 1, 0.82, 1, 0.82, 1];
    track(
      Animated.sequence([
        Animated.timing(wave, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        ...shake.map((v) =>
          Animated.timing(wave, {
            toValue: v,
            duration: 150,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ),
        Animated.timing(wave, {
          toValue: 0,
          duration: 320,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ).start(() => {
      busy.current = false;
    });
  }, [wave, track]);

  const scheduleFun = useCallback(() => {
    funTimer.current = setTimeout(
      () => {
        if (focusedRef.current) {
          funCount.current += 1;
          if (funCount.current % 3 === 0) playCheer();
          else playWave();
        }
        scheduleFun();
      },
      6000 + Math.random() * 4000,
    );
  }, [playCheer, playWave]);

  const startIdle = useCallback(() => {
    if (idleStarted.current) return;
    idleStarted.current = true;
    track(
      Animated.loop(
        Animated.sequence([
          Animated.delay(2400),
          Animated.timing(blink, { toValue: 1, duration: 90, useNativeDriver: true }),
          Animated.timing(blink, { toValue: 0, duration: 130, useNativeDriver: true }),
          Animated.delay(3200),
          Animated.timing(blink, { toValue: 1, duration: 90, useNativeDriver: true }),
          Animated.timing(blink, { toValue: 0, duration: 130, useNativeDriver: true }),
          Animated.delay(250),
          Animated.timing(blink, { toValue: 1, duration: 90, useNativeDriver: true }),
          Animated.timing(blink, { toValue: 0, duration: 130, useNativeDriver: true }),
        ]),
      ),
    ).start();
    track(
      Animated.loop(
        Animated.sequence([
          Animated.timing(idle, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(idle, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
    ).start();
    scheduleFun();
  }, [blink, idle, track, scheduleFun]);

  useEffect(() => {
    if (skip) startIdle();
    return () => {
      if (funTimer.current) clearTimeout(funTimer.current);
      running.current.forEach((a) => a.stop());
      running.current = [];
      idleStarted.current = false;
      busy.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (skip || !w || started.current) return;
    started.current = true;
    hasPlayed = true;

    const steps = track(
      Animated.loop(
        Animated.sequence([
          Animated.timing(walk, {
            toValue: 1,
            duration: 210,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(walk, {
            toValue: 0,
            duration: 210,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    steps.start();

    track(
      Animated.parallel([
        Animated.timing(run, {
          toValue: 1,
          duration: 2700,
          easing: Easing.bezier(0.3, 0.05, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(stretch, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(lean, {
          toValue: PULL_LEAN,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start(() => {
      steps.stop();
      track(
        Animated.parallel([
          Animated.timing(walk, { toValue: 0.5, duration: 200, useNativeDriver: true }),
          Animated.spring(stretch, { toValue: 0, friction: 7, tension: 55, useNativeDriver: true }),
          Animated.spring(lean, {
            toValue: REST_LEAN,
            friction: 6,
            tension: 60,
            useNativeDriver: true,
          }),
          Animated.timing(arms, {
            toValue: 1,
            duration: 560,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ).start(() => {
        startIdle();

        setTimeout(() => playCheer(), 250);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, skip]);

  const groupTx = run.interpolate({ inputRange: [0, 1], outputRange: [-(w + START_X + bleed), 0] });
  const nameTx = Animated.add(
    groupTx,
    stretch.interpolate({ inputRange: [0, 1], outputRange: [0, -LAG] }),
  );

  const ropeScale = stretch.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.max(0.001, (GAP + handDx) / ROPE_W), 1],
    extrapolate: "clamp",
  });
  const ropeOpacity = stretch.interpolate({
    inputRange: [0, 0.15],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const bodyRot = Animated.add(
    Animated.add(lean, walk.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] })),
    idle.interpolate({ inputRange: [0, 1], outputRange: [-1.5, 1.5] }),
  );
  const rotY = walk.interpolate({ inputRange: [0, 1], outputRange: ["-14deg", "14deg"] });
  const bob = Animated.add(
    walk.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-3, 0, -3] }),
    idle.interpolate({ inputRange: [0, 1], outputRange: [0, -1.2] }),
  );
  const footLeftY = walk.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-7 * k, 0, 0] });
  const footRightY = walk.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, -7 * k] });

  const leftRot = Animated.add(
    Animated.add(
      arms.interpolate({
        inputRange: [0, 1],
        outputRange: [ARM_POSE.pull.left, ARM_POSE.folded.left],
      }),
      walk.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] }),
    ),
    cheer.interpolate({ inputRange: [0, 1], outputRange: [0, 226] }),
  );
  const rightRot = Animated.add(
    Animated.add(
      Animated.add(
        arms.interpolate({
          inputRange: [0, 1],
          outputRange: [ARM_POSE.pull.right, ARM_POSE.folded.right],
        }),
        walk.interpolate({ inputRange: [0, 1], outputRange: [5, -5] }),
      ),
      cheer.interpolate({ inputRange: [0, 1], outputRange: [0, -226] }),
    ),
    wave.interpolate({ inputRange: [0, 1], outputRange: [0, -186] }),
  );

  const tailRot = Animated.add(
    Animated.add(
      stretch.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }),
      walk.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] }),
    ),
    idle.interpolate({ inputRange: [0, 1], outputRange: [-2, 2] }),
  );

  const eyeScale = blink.interpolate({ inputRange: [0, 1], outputRange: [1, 0.08] });
  const eyeDy = (EYE_PIVOT_Y - CENTER.y) * k;

  const jumpY = jump.interpolate({ inputRange: [-0.2, 0, 1], outputRange: [2.5, 0, -JUMP_PX] });
  const squash = jump.interpolate({ inputRange: [-0.2, 0, 1], outputRange: [0.9, 1, 1.05] });
  const squashX = jump.interpolate({ inputRange: [-0.2, 0, 1], outputRange: [1.06, 1, 0.97] });
  const feetDy = (FEET_PIVOT.y - CENTER.y) * k;

  const shadowS = jump.interpolate({ inputRange: [-0.2, 0, 1], outputRange: [1.05, 1, 0.68] });
  const shadowO = jump.interpolate({ inputRange: [-0.2, 0, 1], outputRange: [1, 1, 0.55] });
  const shadowDy = (SHADOW_Y - CENTER.y) * k;

  const frame = { position: "absolute" as const, left: 0, top: 0, width: FW, height: FH };

  return (
    <View
      style={{
        overflow: "hidden",
        alignSelf: "stretch",
        marginLeft: -bleed,
        paddingLeft: bleed,
        paddingVertical: Math.round(size * 0.4) + 6,
        marginVertical: -(Math.round(size * 0.4) + 6),
      }}
    >
      <View
        onLayout={onLayout}
        style={{
          alignSelf: "flex-start",
          marginLeft: START_X,
          maxWidth: winW - START_X - 16,
          flexDirection: "row",
          alignItems: "flex-end",
          opacity: w ? 1 : 0,
        }}
      >
        <Animated.View style={{ flexShrink: 1, transform: [{ translateX: nameTx }] }}>
          <Text
            numberOfLines={1}
            className="text-[28px] font-gendy tracking-tight text-ink dark:text-ink-dark"
            style={{ lineHeight: 34 }}
          >
            {name}
          </Text>

          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: "100%",
              bottom: ROPE_BOTTOM,
              width: ROPE_W,
              height: ROPE_H,
              borderRadius: ROPE_H / 2,
              backgroundColor: "#B98A57",
              opacity: ropeOpacity,
              transform: [
                { translateX: -ROPE_W / 2 },
                { scaleX: ropeScale },
                { translateX: ROPE_W / 2 },
              ],
            }}
          >
            <View
              style={{
                position: "absolute",
                top: 0.5,
                left: 1,
                right: 1,
                height: 1.4,
                borderRadius: 1,
                backgroundColor: "#E0B98A",
                opacity: 0.85,
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 1.2,
                borderBottomLeftRadius: ROPE_H / 2,
                borderBottomRightRadius: ROPE_H / 2,
                backgroundColor: "#8E6338",
                opacity: 0.7,
              }}
            />
          </Animated.View>
        </Animated.View>

        <Pressable
          onPress={playCheer}
          hitSlop={12}
          style={{ width: contW, height: contH, marginLeft: GAP, flexShrink: 0 }}
        >
          <Animated.View
            style={{ width: contW, height: contH, transform: [{ translateX: groupTx }] }}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                frame,
                {
                  left: frameLeft,
                  top: frameTop,
                  opacity: shadowO,
                  transform: [
                    { translateY: shadowDy },
                    { scaleX: shadowS },
                    { scaleY: shadowS },
                    { translateY: -shadowDy },
                  ],
                },
              ]}
            >
              <Art xml={art.shadow} w={FW} h={FH} />
            </Animated.View>

            <Animated.View
              pointerEvents="none"
              style={[
                frame,
                {
                  left: frameLeft,
                  top: frameTop,
                  transform: [
                    { translateY: jumpY },
                    { translateY: feetDy },
                    { scaleX: squashX },
                    { scaleY: squash },
                    { translateY: -feetDy },
                  ],
                },
              ]}
            >
              <Animated.View
                style={[
                  frame,
                  {
                    transform: [
                      { perspective: 800 },
                      { rotateY: rotY },
                      { translateY: bob },
                      ...pivot(FEET_PIVOT.x, FEET_PIVOT.y, deg(bodyRot)),
                    ],
                  },
                ]}
              >
                <Art xml={art.torso} w={FW} h={FH} />

                <Animated.View
                  style={[
                    frame,
                    {
                      transform: [
                        { translateY: eyeDy },
                        { scaleY: eyeScale },
                        { translateY: -eyeDy },
                      ],
                    },
                  ]}
                >
                  <Art xml={art.eyes} w={FW} h={FH} />
                </Animated.View>

                {scarf && art.scarfTail ? (
                  <Animated.View
                    style={[frame, { transform: pivot(TAIL_PIVOT.x, TAIL_PIVOT.y, deg(tailRot)) }]}
                  >
                    <Art xml={art.scarfTail} w={FW} h={FH} />
                  </Animated.View>
                ) : null}

                <Animated.View
                  style={[
                    frame,
                    { transform: pivot(SHOULDER_LEFT.x, SHOULDER_LEFT.y, deg(leftRot)) },
                  ]}
                >
                  <Art xml={art.flipperLeft} w={FW} h={FH} />
                </Animated.View>
                <Animated.View
                  style={[
                    frame,
                    { transform: pivot(SHOULDER_RIGHT.x, SHOULDER_RIGHT.y, deg(rightRot)) },
                  ]}
                >
                  <Art xml={art.flipperRight} w={FW} h={FH} />
                </Animated.View>
              </Animated.View>

              <Animated.View style={[frame, { transform: [{ translateY: footLeftY }] }]}>
                <Art xml={art.footLeft} w={FW} h={FH} />
              </Animated.View>
              <Animated.View style={[frame, { transform: [{ translateY: footRightY }] }]}>
                <Art xml={art.footRight} w={FW} h={FH} />
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}
