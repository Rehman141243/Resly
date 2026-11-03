import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Button, useResumeColors } from "./ResumeUI";
import SectionReorder from "./SectionReorder";
import type { SectionItem } from "../../utils/sectionOrder";
import type { OrderSuggestion } from "../../services/suggestService";
import { apiError } from "../../services/resumeService";

type Props = {
  visible: boolean;
  items: SectionItem[];
  onClose: () => void;

  onApply: (keys: string[]) => void | Promise<void>;
  applying?: boolean;

  suggest?: (target: string) => Promise<OrderSuggestion>;
};

export default function SectionOrderSheet({
  visible,
  items,
  onClose,
  onApply,
  applying,
  suggest,
}: Props) {
  const c = useResumeColors();
  const [list, setList] = useState<SectionItem[]>(items);
  const [dragging, setDragging] = useState(false);
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sug, setSug] = useState<OrderSuggestion | null>(null);

  useEffect(() => {
    if (visible) {
      setList(items);
      setDragging(false);
      setErr(null);
      setSug(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const labels = useMemo(() => new Map(items.map((i) => [i.key, i.label])), [items]);
  const changed = list.some((it, i) => it.key !== items[i]?.key);

  const askAi = async () => {
    if (!suggest) return;
    setBusy(true);
    setErr(null);
    try {
      setSug(await suggest(target));
    } catch (e) {
      setErr(apiError(e, "Could not load AI suggestions. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const useSuggestion = () => {
    if (!sug) return;
    const byKey = new Map(list.map((i) => [i.key, i]));
    const head = sug.order.map((k) => byKey.get(k)).filter((x): x is SectionItem => !!x);
    const tail = list.filter((i) => !sug.order.includes(i.key));
    setList([...head, ...tail]);
  };

  const label = (k: string) => labels.get(k) ?? k;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => !applying && onClose()}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
      >
        <View
          style={{
            backgroundColor: c.bg,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 24,
            maxHeight: "90%",
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", color: c.ink }}>Section order</Text>
          <Text style={{ fontSize: 13, color: c.muted, marginTop: 4, marginBottom: 12 }}>
            Drag the handle (≡) or use the arrows to reorder.
          </Text>

          <ScrollView
            scrollEnabled={!dragging}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={{ flexGrow: 0 }}
          >
            {suggest ? (
              <View
                style={{
                  backgroundColor: c.card,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: c.sep,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="sparkles-outline" size={18} color={c.brand} />
                  <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: "700", color: c.ink }}>
                    AI suggestions
                  </Text>
                </View>

                <TextInput
                  value={target}
                  onChangeText={setTarget}
                  maxLength={120}
                  placeholder="Target job (optional), e.g. React Native Developer"
                  placeholderTextColor={c.placeholder}
                  style={{
                    marginTop: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: c.fill,
                    color: c.ink,
                    fontSize: 15,
                  }}
                />

                <Button
                  label={sug ? "Ask again" : "Suggest best order"}
                  variant="secondary"
                  onPress={askAi}
                  loading={busy}
                  style={{ marginTop: 10, height: 44 }}
                />

                {err ? (
                  <Text style={{ color: c.error, fontSize: 13, marginTop: 8 }}>{err}</Text>
                ) : null}

                {sug ? (
                  <View style={{ marginTop: 14 }}>
                    {sug.source === "rules" ? (
                      <Text style={{ fontSize: 12, color: c.muted, marginBottom: 6 }}>
                        AI was unavailable, so basic rules were used.
                      </Text>
                    ) : null}
                    <Text style={{ fontSize: 14, lineHeight: 20, color: c.ink }}>
                      {sug.summary}
                    </Text>

                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: c.muted,
                        marginTop: 12,
                        marginBottom: 4,
                      }}
                    >
                      SUGGESTED ORDER
                    </Text>
                    {sug.order
                      .filter((k) => labels.has(k))
                      .map((k, i) => (
                        <View key={k} style={{ flexDirection: "row", marginBottom: 6 }}>
                          <Text
                            style={{ width: 22, fontSize: 14, fontWeight: "700", color: c.brand }}
                          >
                            {i + 1}.
                          </Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: "600", color: c.ink }}>
                              {label(k)}
                            </Text>
                            {sug.reasons[k] ? (
                              <Text style={{ fontSize: 13, lineHeight: 18, color: c.muted }}>
                                {sug.reasons[k]}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      ))}

                    <Button
                      label="Use this order"
                      onPress={useSuggestion}
                      style={{ marginTop: 6, height: 44 }}
                    />

                    {sug.tips.length > 0 ? (
                      <>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: c.muted,
                            marginTop: 14,
                            marginBottom: 4,
                          }}
                        >
                          TIPS
                        </Text>
                        {sug.tips
                          .filter((t) => labels.has(t.section))
                          .map((t, i) => (
                            <View key={i} style={{ flexDirection: "row", marginBottom: 6 }}>
                              <Text style={{ width: 16, color: c.muted }}>•</Text>
                              <Text style={{ flex: 1, fontSize: 13, lineHeight: 18, color: c.ink }}>
                                <Text style={{ fontWeight: "700" }}>{label(t.section)}: </Text>
                                {t.tip}
                              </Text>
                            </View>
                          ))}
                      </>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}

            {list.length ? (
              <SectionReorder items={list} onChange={setList} onDragChange={setDragging} />
            ) : (
              <Text style={{ color: c.muted, paddingVertical: 20, textAlign: "center" }}>
                This resume has no sections yet.
              </Text>
            )}
          </ScrollView>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <Button
              label="Cancel"
              variant="secondary"
              style={{ flex: 1 }}
              onPress={onClose}
              disabled={applying}
            />
            <Button
              label="Apply"
              style={{ flex: 1.4 }}
              onPress={() => onApply(list.map((i) => i.key))}
              loading={applying}
              disabled={!changed}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
