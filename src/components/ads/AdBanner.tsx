import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import { ADMOB_BANNER_ANDROID, ADMOB_BANNER_IOS } from "../../config/env";
import { useAccess } from "../../context/AccessContext";
import { ensureAdsReady } from "../../services/rewardedAds";

const REAL_UNIT = Platform.OS === "ios" ? ADMOB_BANNER_IOS : ADMOB_BANNER_ANDROID;
const UNIT_ID = __DEV__ || !REAL_UNIT ? TestIds.ADAPTIVE_BANNER : REAL_UNIT;

/** Debug builds only: says why the banner is not showing. */
function DevNote({ text }: { text: string }) {
  if (!__DEV__) return null;
  return (
    <Text style={{ textAlign: "center", fontSize: 12, color: "#EF4444", marginBottom: 8 }}>
      {text}
    </Text>
  );
}

/** Banner shown while ads are on. Renders nothing if ads are off or a release build has no unit id. */
export default function AdBanner() {
  const { access, showAds } = useAccess();
  const [failed, setFailed] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    ensureAdsReady().then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  if (!access) return <DevNote text="Ads: /ads/access did not load (check API and login)" />;
  if (!showAds) return <DevNote text="Ads: backend sent showAds=false (set ADS_ENABLED=true)" />;
  if (!__DEV__ && !REAL_UNIT) return null;
  if (!ready) return null;
  if (failed) return <DevNote text={`Banner failed: ${failed}`} />;

  return (
    <View style={{ alignItems: "center", marginBottom: 12 }}>
      <BannerAd
        unitId={UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={(e) => {
          if (__DEV__) console.warn("Banner ad failed:", e);
          setFailed(String((e as any)?.code ?? (e as any)?.message ?? "unknown"));
        }}
      />
    </View>
  );
}
