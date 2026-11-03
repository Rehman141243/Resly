import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ensureAdsReady,
  preloadInterstitial,
  preloadRewarded,
  showInterstitial,
  showRewarded,
} from "../services/rewardedAds";
import type { TemplateInfo } from "../types/resume";
import { AdAccess, adsService } from "../services/adsService";
import { ADS_TEST_MODE } from "../config/env";

/** Fewest ads a user must watch per template, whatever the server says. */
export const MIN_ADS = 3;

export const adsNeeded = (access: AdAccess | null): number =>
  Math.max(MIN_ADS, access?.adsRequired ?? 0);

/** True when the template can be used right now (free, already unlocked, or ads are off). */
export const templateOpen = (
  access: AdAccess | null,
  tpl: Pick<TemplateInfo, "id" | "adUnlockable">,
): boolean => {
  // Only the ad-unlockable templates can ever be used. Everything else stays locked.
  if (!tpl.adUnlockable) return false;
  if (!access) return false;
  if (!access.showAds) return true;
  return access.unlocked.includes(tpl.id) && (access.progress[tpl.id] ?? 0) >= adsNeeded(access);
};

export type UnlockOutcome =
  | { status: "unlocked" | "progress"; watched: number; required: number }
  | { status: "cancelled" | "pending" }
  | { status: "no_ad"; reason?: string };

type Ctx = {
  access: AdAccess | null;

  showAds: boolean;
  refresh: () => Promise<AdAccess | null>;

  canUse: (tpl: Pick<TemplateInfo, "id" | "adUnlockable">) => boolean;

  watched: (templateId: string) => number;

  prepareUnlock: (templateId: string) => void;

  unlockWithAd: (templateId: string) => Promise<UnlockOutcome>;

  withAd: <T>(action: () => Promise<T>) => Promise<T>;
};

const AccessCtx = createContext<Ctx | null>(null);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function AccessProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: React.ReactNode;
}) {
  const [access, setAccess] = useState<AdAccess | null>(null);
  const accessRef = useRef<AdAccess | null>(null);
  accessRef.current = access;

  const refresh = useCallback(async () => {
    if (!userId) {
      setAccess(null);
      return null;
    }
    try {
      const a = await adsService.access();
      setAccess(a);
      return a;
    } catch (e) {
      if (__DEV__) console.warn("GET /ads/access failed:", e);
      return accessRef.current;
    }
  }, [userId]);

  useEffect(() => {
    setAccess(null);
    if (userId) void refresh();
  }, [userId, refresh]);

  const showAds = !!access && access.showAds;
  const showAdsRef = useRef(showAds);
  showAdsRef.current = showAds;



  useEffect(() => {
    if (showAds) preloadInterstitial();
  }, [showAds]);

  const canUse = useCallback<Ctx["canUse"]>((tpl) => templateOpen(access, tpl), [access]);

  const watched = useCallback((id: string) => access?.progress[id] ?? 0, [access]);

  const prepareUnlock = useCallback(
    (templateId: string) => {
      if (userId) preloadRewarded(userId, templateId);
    },
    [userId],
  );

  const unlockWithAd = useCallback<Ctx["unlockWithAd"]>(
    async (templateId) => {
      if (!userId) return { status: "no_ad" };
      const was = accessRef.current?.progress[templateId] ?? 0;

      let earned = false;
      try {
        earned = await showRewarded(userId, templateId);
      } catch (e) {
        const err = e as { code?: string; message?: string };
        const reason = String(err?.code ?? err?.message ?? "").replace("googleMobileAds/", "");
        if (__DEV__) console.warn("Rewarded ad failed:", e);
        return { status: "no_ad", reason: reason || undefined };
      }
      if (!earned) return { status: "cancelled" };

      const summarize = (a: AdAccess | null): UnlockOutcome | null => {
        if (!a) return null;
        const w = a.progress[templateId] ?? 0;
        const need = adsNeeded(a);
        if (a.unlocked.includes(templateId) && w >= need)
          return { status: "unlocked", watched: need, required: need };
        if (w > was) return { status: "progress", watched: w, required: need };
        return null;
      };

      if (ADS_TEST_MODE) {
        try {
          await adsService.testReport(templateId);
        } catch {}
        const out = summarize(await refresh());
        if (out) return out;
      }

      for (let i = 0; i < 6; i++) {
        await sleep(1500);
        const out = summarize(await refresh());
        if (out) return out;
      }
      return { status: "pending" };
    },
    [userId, refresh],
  );

  const withAd = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    if (!showAdsRef.current) return action();

    const [, res] = await Promise.allSettled([showInterstitial(), action()]);

    if (res.status === "rejected") throw res.reason;
    return res.value;
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      access,
      showAds,
      refresh,
      canUse,
      watched,
      prepareUnlock,
      unlockWithAd,
      withAd,
    }),
    [access, showAds, refresh, canUse, watched, prepareUnlock, unlockWithAd, withAd],
  );

  return <AccessCtx.Provider value={value}>{children}</AccessCtx.Provider>;
}

export function useAccess(): Ctx {
  const v = useContext(AccessCtx);
  if (!v) throw new Error("useAccess must be used inside <AccessProvider>");
  return v;
}
