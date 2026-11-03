import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { PAGE_RATIO, fitToPage, resumeService } from "../../services/resumeService";

const cache = new Map<string, string>();

export default function TemplateThumb({ id, width }: { id: string; width: number; v?: string }) {
  const height = Math.round(width * PAGE_RATIO);
  const [html, setHtml] = useState<string | null>(cache.get(id) ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (cache.has(id)) return;
    let alive = true;
    resumeService
      .templatePreviewHtml(id)
      .then((h) => {
        cache.set(id, h);
        if (alive) setHtml(h);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [id]);

  const source = useMemo(
    () => (html ? { html: fitToPage(html, width, false) } : null),
    [html, width],
  );

  return (
    <View
      pointerEvents="none"
      style={{ width, height, backgroundColor: "#FFFFFF", overflow: "hidden" }}
    >
      {source ? (
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
          scrollEnabled={false}
          bounces={false}
          style={{ width, height, backgroundColor: "#FFFFFF" }}
        />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          {failed ? (
            <Text style={{ fontSize: 11, color: "#8E8E93" }}>Preview unavailable</Text>
          ) : (
            <ActivityIndicator />
          )}
        </View>
      )}
    </View>
  );
}
