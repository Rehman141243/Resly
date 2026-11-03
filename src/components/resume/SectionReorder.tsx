import { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, Text, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useResumeColors } from "./ResumeUI";
import { SectionItem } from "../../utils/sectionOrder";

const ROW_H = 58;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

type RowProps = {
  item: SectionItem;
  index: number;
  total: number;
  shift: number;
  dragging: boolean;
  active: boolean;
  onStart: (i: number) => void;
  onHover: (to: number) => void;
  onDrop: (from: number, to: number) => void;
};

function Row(props: RowProps) {
  const c = useResumeColors();
  const p = useRef(props);
  p.current = props;

  const y = useRef(new Animated.Value(0)).current;
  const shift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!props.dragging) shift.setValue(0);
    else
      Animated.timing(shift, {
        toValue: props.shift,
        duration: 140,
        useNativeDriver: true,
      }).start();
  }, [props.shift, props.dragging, shift]);

  const target = (dy: number) =>
    clamp(Math.round(p.current.index + dy / ROW_H), 0, p.current.total - 1);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        y.setValue(0);
        p.current.onStart(p.current.index);
      },
      onPanResponderMove: (_, g) => {
        y.setValue(g.dy);
        p.current.onHover(target(g.dy));
      },
      onPanResponderRelease: (_, g) => {
        y.setValue(0);
        p.current.onDrop(p.current.index, target(g.dy));
      },
      onPanResponderTerminate: () => {
        y.setValue(0);
        p.current.onDrop(p.current.index, p.current.index);
      },
    }),
  ).current;

  const { item, index, total, active } = props;

  return (
    <Animated.View
      style={{
        height: ROW_H,
        zIndex: active ? 20 : 0,
        transform: [{ translateY: active ? y : shift }, { scale: active ? 1.02 : 1 }],
      }}
    >
      <View
        style={{
          flex: 1,
          marginVertical: 4,
          borderRadius: 12,
          backgroundColor: c.card,
          flexDirection: "row",
          alignItems: "center",
          paddingLeft: 6,
          paddingRight: 10,
          borderWidth: 1,
          borderColor: active ? c.brand : c.sep,
          shadowColor: "#000",
          shadowOpacity: active ? 0.25 : 0,
          shadowOffset: { width: 0, height: 6 },
          shadowRadius: 10,
          elevation: active ? 8 : 0,
        }}
      >
        <View
          {...pan.panHandlers}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          style={{ width: 44, height: "100%", alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="reorder-three" size={26} color={c.muted} />
        </View>

        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: "600", color: c.ink }}>
            {item.label}
          </Text>
          <Text style={{ fontSize: 12, color: c.muted, marginTop: 1 }}>
            {item.count} {item.count === 1 ? "entry" : "entries"}
          </Text>
        </View>

        <Pressable
          onPress={() => props.onDrop(index, index - 1)}
          disabled={index === 0}
          hitSlop={8}
          style={{ padding: 6, opacity: index === 0 ? 0.25 : 1 }}
        >
          <Ionicons name="chevron-up" size={22} color={c.brand} />
        </Pressable>
        <Pressable
          onPress={() => props.onDrop(index, index + 1)}
          disabled={index === total - 1}
          hitSlop={8}
          style={{ padding: 6, opacity: index === total - 1 ? 0.25 : 1 }}
        >
          <Ionicons name="chevron-down" size={22} color={c.brand} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function SectionReorder({
  items,
  onChange,
  onDragChange,
}: {
  items: SectionItem[];
  onChange: (next: SectionItem[]) => void;

  onDragChange?: (dragging: boolean) => void;
}) {
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);

  const start = (i: number) => {
    setDrag({ from: i, to: i });
    onDragChange?.(true);
  };
  const hover = (to: number) => setDrag((d) => (d && d.to !== to ? { ...d, to } : d));
  const drop = (from: number, to: number) => {
    setDrag(null);
    onDragChange?.(false);
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onChange(next);
  };

  const shiftFor = (i: number) => {
    if (!drag || i === drag.from) return 0;
    if (drag.from < drag.to && i > drag.from && i <= drag.to) return -ROW_H;
    if (drag.from > drag.to && i >= drag.to && i < drag.from) return ROW_H;
    return 0;
  };

  return (
    <View>
      {items.map((it, i) => (
        <Row
          key={it.key}
          item={it}
          index={i}
          total={items.length}
          shift={shiftFor(i)}
          dragging={!!drag}
          active={drag?.from === i}
          onStart={start}
          onHover={hover}
          onDrop={drop}
        />
      ))}
    </View>
  );
}
