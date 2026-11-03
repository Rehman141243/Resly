import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import BottomSheet from "../common/BottomSheet";
import TemplateThumb from "../resume/TemplateThumb";
import { Button, useResumeColors } from "../resume/ResumeUI";
import { adsNeeded, useAccess } from "../../context/AccessContext";
import { useToast } from "../../context/ToastContext";
import type { TemplateInfo } from "../../types/resume";

type Props = {
  visible: boolean;
  template: TemplateInfo | null;
  onClose: () => void;
  /** Called once the last required ad has been confirmed by the server. */
  onUnlocked: (t: TemplateInfo) => void;
};

const THUMB_W = 120;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function UnlockSheet({ visible, template, onClose, onUnlocked }: Props) {
  const c = useResumeColors();
  const toast = useToast();
  const { access, watched, prepareUnlock, unlockWithAd } = useAccess();
  const [busy, setBusy] = useState(false);
  // iOS cannot show a full-screen ad on top of an open React Native <Modal>,
  // so the sheet is hidden while the ad plays and comes back afterwards.
  const [hidden, setHidden] = useState(false);

  const id = template?.id ?? "";
  const required = adsNeeded(access);
  const done = Math.min(watched(id), required);

  useEffect(() => {
    if (visible && id) prepareUnlock(id);
  }, [visible, id, prepareUnlock]);

  if (!template) return null;

  const watch = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (Platform.OS === "ios") {
        setHidden(true);
        await sleep(600); // let the modal finish dismissing
      }
      let out;
      try {
        out = await unlockWithAd(template.id);
      } finally {
        if (Platform.OS === "ios") {
          await sleep(300); // let the ad finish dismissing before the sheet returns
          setHidden(false);
        }
      }
      switch (out.status) {
        case "unlocked":
          toast.success("Template unlocked", `${template.name} is ready to use.`);
          onUnlocked(template);
          return;
        case "progress":
          toast.success(`Ad ${out.watched} of ${out.required} done`, "Watch one more to continue.");
          break;
        case "cancelled":
          toast.info("Ad closed early", "Watch the full ad for it to count.");
          break;
        case "no_ad":
          toast.error(
            "No ad available",
            out.reason ? `Try again in a moment. (${out.reason})` : "Try again in a moment.",
          );
          break;
        case "pending":
          toast.info(
            "Reward not confirmed yet",
            "Your ad was watched but the server has not confirmed it. Wait a few seconds and tap again.",
          );
          break;
      }
      prepareUnlock(template.id);
    } finally {
      setBusy(false);
    }
  };

  const left = Math.max(required - done, 0);

  return (
    <BottomSheet
      visible={visible && !hidden}
      onClose={busy ? () => undefined : onClose}
      title="Unlock this template"
      subtitle={`Watch ${required} short ads to unlock ${template.name} for good.`}
    >
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <View
          style={{
            borderRadius: 10,
            overflow: "hidden",
            borderWidth: 0.5,
            borderColor: c.sep,
            backgroundColor: "#FFFFFF",
          }}
        >
          <TemplateThumb id={template.id} width={THUMB_W} />
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 8 }}>
        {Array.from({ length: required }).map((_, i) => (
          <View
            key={i}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              marginHorizontal: 6,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: i < done ? c.brand : "transparent",
              borderWidth: 1.5,
              borderColor: i < done ? c.brand : c.line,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: i < done ? "#FFFFFF" : c.muted,
              }}
            >
              {i < done ? "✓" : i + 1}
            </Text>
          </View>
        ))}
      </View>
      <Text style={{ textAlign: "center", fontSize: 14, color: c.muted, marginBottom: 20 }}>
        {done} of {required} ads watched
      </Text>

      <Button
        label={done === 0 ? "Watch ad" : `Watch ad (${left} more)`}
        onPress={watch}
        loading={busy}
      />
    </BottomSheet>
  );
}
