import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { WebView } from "react-native-webview";
import { AppStackParamList } from "../../types/navigation";
import type { ResumeData } from "../../types/resume";
import { apiCode, apiError, resumeService } from "../../services/resumeService";
import { downloadResume } from "../../services/downloadResume";
import { buildItems, mergeOrder, SectionItem } from "../../utils/sectionOrder";
import { Button, CenterState, Header, useResumeColors } from "../../components/resume/ResumeUI";
import { suggestSectionOrder } from "../../services/suggestService";
import SectionOrderSheet from "../../components/resume/SectionOrderSheet";
import UnlockSheet from "../../components/ads/UnlockSheet";
import { useAccess } from "../../context/AccessContext";
import type { TemplateInfo } from "../../types/resume";

type Props = NativeStackScreenProps<AppStackParamList, "ResumePreview">;

const PAGE_W = 794;
const PAGE_H = 1123;
const SIDE = 10;
const VIEWER_BG = "#E5E5EA";

function toViewerHtml(html: string, screenW: number) {
  const scale = Math.max(0.2, Number(((screenW - SIDE * 2) / PAGE_W).toFixed(4)));

  const inject = `
<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=4, user-scalable=yes">
<style>
  html {
    background: ${VIEWER_BG} !important;
    margin: 0 !important;
    padding: ${SIDE}px 0 ${SIDE * 2}px !important;
    width: 100% !important;
    -webkit-text-size-adjust: 100%;
  }
  body {
    zoom: ${scale};
    box-sizing: border-box !important;
    width: ${PAGE_W}px !important;
    min-width: ${PAGE_W}px !important;
    max-width: ${PAGE_W}px !important;
    min-height: ${PAGE_H}px !important;
    margin: 0 auto !important;
    background: #FFFFFF !important;
    box-shadow: 0 2px 14px rgba(0,0,0,0.28);
    overflow-x: hidden;
  }
</style>`;

  const cleaned = html.replace(/<meta[^>]*name=["']viewport["'][^>]*>/gi, "");

  if (/<head[^>]*>/i.test(cleaned)) {
    return cleaned.replace(/<head[^>]*>/i, (m) => `${m}${inject}`);
  }
  return `<!doctype html><html><head>${inject}</head><body>${cleaned}</body></html>`;
}

export default function ResumePreviewScreen({ navigation, route }: Props) {
  const { resumeId, title } = route.params;
  const c = useResumeColors();
  const { width: screenW } = useWindowDimensions();

  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lockedTpl, setLockedTpl] = useState<TemplateInfo | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const { refresh } = useAccess();
  const [downloading, setDownloading] = useState(false);

  const [sheet, setSheet] = useState(false);
  const [opening, setOpening] = useState(false);
  const [applying, setApplying] = useState(false);
  const [doc, setDoc] = useState<{ title: string; data: ResumeData } | null>(null);
  const [items, setItems] = useState<SectionItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLockedTpl(null);
    try {
      setHtml(await resumeService.previewHtml(resumeId));
    } catch (e) {
      if (apiCode(e) === "TEMPLATE_LOCKED") {
        try {
          const row = await resumeService.get(resumeId);
          const all = await resumeService.listTemplates();
          setLockedTpl(all.find((t) => t.id === row.template_id) ?? null);
        } catch {}
      }
      setError(apiError(e, "Couldn't load the preview."));
    } finally {
      setLoading(false);
    }
  }, [resumeId]);

  useEffect(() => {
    load();
  }, [load]);

  const source = useMemo(
    () => (html ? { html: toViewerHtml(html, screenW) } : null),
    [html, screenW],
  );

  const download = async () => {
    setDownloading(true);
    try {
      const r = await downloadResume(resumeId, title);
      if (r === "locked") await load();
    } finally {
      setDownloading(false);
    }
  };

  const goEdit = () => navigation.replace("ResumeEditor", { resumeId });

  const openSections = async () => {
    setOpening(true);
    try {
      const r = await resumeService.get(resumeId);
      setDoc({ title: r.title, data: r.data });
      setItems(buildItems(r.data));
      setSheet(true);
    } catch (e) {
      Alert.alert("Couldn't open sections", apiError(e, "Please try again."));
    } finally {
      setOpening(false);
    }
  };

  const applyOrder = async (keys: string[]) => {
    if (!doc) return;
    setApplying(true);
    try {
      const data: ResumeData = { ...doc.data, sectionOrder: mergeOrder(doc.data, keys) };
      await resumeService.update(resumeId, { title: doc.title || title || "Resume", data });
      setSheet(false);
      await load();
    } catch (e) {
      Alert.alert("Couldn't save", apiError(e, "Please try again."));
    } finally {
      setApplying(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top", "bottom"]}>
      <Header
        title={title || "Preview"}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            onPress={goEdit}
            activeOpacity={0.5}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ color: c.brand, fontSize: 17, fontWeight: "600" }}>Edit</Text>
          </TouchableOpacity>
        }
      />

      {loading ? (
        <CenterState loading />
      ) : error || !source ? (
        lockedTpl ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
            <Text style={{ color: c.muted, fontSize: 15, textAlign: "center", marginBottom: 16 }}>
              This resume uses the locked template "{lockedTpl.name}". Watch a few ads to unlock it
              and view or download this resume.
            </Text>
            <Button
              label="Unlock template"
              onPress={() => setUnlockOpen(true)}
              style={{ paddingHorizontal: 32 }}
            />
          </View>
        ) : (
          <CenterState message={error ?? "Preview not found."} onRetry={load} />
        )
      ) : (
        <>
          <View style={{ flex: 1, backgroundColor: VIEWER_BG }}>
            <WebView
              source={source}

              originWhitelist={["about:blank"]}
              javaScriptEnabled={false}
              domStorageEnabled={false}
              allowFileAccess={false}
              allowsLinkPreview={false}
              setSupportMultipleWindows={false}
              mixedContentMode="never"
              onShouldStartLoadWithRequest={(r) => !/^https?:/i.test(r.url)}
              style={{ flex: 1, backgroundColor: VIEWER_BG }}
              setBuiltInZoomControls={false}
              setDisplayZoomControls={false}
              automaticallyAdjustContentInsets={false}
              contentInsetAdjustmentBehavior="never"
              showsVerticalScrollIndicator
              showsHorizontalScrollIndicator={false}
              bounces
            />
          </View>

          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: 8,
              flexDirection: "row",
              gap: 10,
            }}
          >
            <Button label="Edit" variant="secondary" style={{ flex: 1 }} onPress={goEdit} />
            <Button
              label="Sections"
              variant="secondary"
              style={{ flex: 1.2 }}
              onPress={openSections}
              loading={opening}
            />
            <Button
              label="Download PDF"
              style={{ flex: 1.6 }}
              onPress={download}
              loading={downloading}
            />
          </View>
        </>
      )}

      <UnlockSheet
        visible={unlockOpen}
        template={lockedTpl}
        onClose={() => setUnlockOpen(false)}
        onUnlocked={() => {
          setUnlockOpen(false);
          refresh();
          load();
        }}
      />

      <SectionOrderSheet
        visible={sheet}
        items={items}
        onClose={() => setSheet(false)}
        onApply={applyOrder}
        applying={applying}
        suggest={doc ? (target: any) => suggestSectionOrder(doc.data, target) : undefined}
      />
    </SafeAreaView>
  );
}
