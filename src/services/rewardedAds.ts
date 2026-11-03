import { Platform } from "react-native";
import mobileAds, {
  AdEventType,
  AdsConsent,
  AdsConsentStatus,
  InterstitialAd,
  MaxAdContentRating,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import {
  ADMOB_INTERSTITIAL_ANDROID,
  ADMOB_INTERSTITIAL_IOS,
  ADMOB_REWARDED_ANDROID,
  ADMOB_REWARDED_IOS,
} from "../config/env";

const ios = Platform.OS === "ios";
const REAL_REWARDED = ios ? ADMOB_REWARDED_IOS : ADMOB_REWARDED_ANDROID;
const REAL_INTERSTITIAL = ios ? ADMOB_INTERSTITIAL_IOS : ADMOB_INTERSTITIAL_ANDROID;
const REWARDED_UNIT_ID = __DEV__ || !REAL_REWARDED ? TestIds.REWARDED : REAL_REWARDED;
const INTERSTITIAL_UNIT_ID =
  __DEV__ || !REAL_INTERSTITIAL ? TestIds.INTERSTITIAL : REAL_INTERSTITIAL;

if (!__DEV__ && (!REAL_REWARDED || !REAL_INTERSTITIAL)) {
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let initPromise: Promise<void> | null = null;

/** Starts AdMob once (consent + initialize). Safe to call many times. */
export function initAds(): Promise<void> {
  if (!initPromise) initPromise = runInit();
  return initPromise;
}

/** Resolves when AdMob is ready, or after a short wait so a slow consent form never blocks ads. */
export function ensureAdsReady(timeoutMs = 8000): Promise<void> {
  return Promise.race([initAds(), sleep(timeoutMs)]);
}

async function runInit() {
  try {
    const info = await AdsConsent.requestInfoUpdate();
    if (info.isConsentFormAvailable && info.status === AdsConsentStatus.REQUIRED) {
      await AdsConsent.showForm();
    }
  } catch (e) {}

  try {
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.PG,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
    await mobileAds().initialize();
  } catch (e) {}
}

type Slot = { key: string; ad: RewardedAd };
let slot: Slot | null = null;
let pending: { key: string; p: Promise<RewardedAd> } | null = null;

const keyOf = (userId: string, templateId: string) => `${userId}:${templateId}`;

function loadRewarded(userId: string, templateId: string): Promise<RewardedAd> {
  const key = keyOf(userId, templateId);
  if (slot?.key === key) return Promise.resolve(slot.ad);
  if (pending?.key === key) return pending.p;

  const p = ensureAdsReady().then(
    () =>
      new Promise<RewardedAd>((resolve, reject) => {
        const ad = RewardedAd.createForAdRequest(REWARDED_UNIT_ID, {
          serverSideVerificationOptions: { userId, customData: templateId },
        });
        const cleanup = () => {
          offLoaded();
          offError();
        };
        const offLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
          cleanup();
          slot = { key, ad };
          pending = null;
          resolve(ad);
        });
        const offError = ad.addAdEventListener(AdEventType.ERROR, (err) => {
          if (__DEV__) console.warn("Rewarded ad load error:", err);
          cleanup();
          pending = null;
          reject(err);
        });
        ad.load();
      }),
  );
  pending = { key, p };
  p.catch(() => {
    if (pending?.p === p) pending = null;
  });
  return p;
}

export function preloadRewarded(userId: string, templateId: string) {
  loadRewarded(userId, templateId).catch(() => undefined);
}

export async function showRewarded(
  userId: string,
  templateId: string,
  loadTimeoutMs = 10000,
): Promise<boolean> {
  const ad = await Promise.race([
    loadRewarded(userId, templateId),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("ad-load-timeout")), loadTimeoutMs),
    ),
  ]);

  return new Promise<boolean>((resolve, reject) => {
    let earned = false;
    const done = () => {
      offReward();
      offClosed();
      offError();
      slot = null;
    };
    const offReward = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });
    const offClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      done();
      resolve(earned);
    });
    const offError = ad.addAdEventListener(AdEventType.ERROR, (err) => {
      done();
      reject(err);
    });
    ad.show().catch((err) => {
      done();
      reject(err);
    });
  });
}

const MIN_GAP_MS = 60_000;
let itAd: InterstitialAd | null = null;
let itReady = false;
let itLoading = false;
let lastShown = 0;

function loadInterstitial() {
  if (itLoading || itReady) return;
  itLoading = true;
  void ensureAdsReady().then(startInterstitialLoad);
}

function startInterstitialLoad() {
  const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID);
  const off = () => {
    offLoaded();
    offError();
  };
  const offLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
    off();
    itAd = ad;
    itReady = true;
    itLoading = false;
  });
  const offError = ad.addAdEventListener(AdEventType.ERROR, () => {
    off();
    itLoading = false;
  });
  ad.load();
}

export const preloadInterstitial = loadInterstitial;

export async function showInterstitial(waitMs = 4000): Promise<void> {
  if (Date.now() - lastShown < MIN_GAP_MS) return;

  if (!itReady) {
    loadInterstitial();
    const end = Date.now() + waitMs;
    while (!itReady && Date.now() < end) await sleep(200);
  }
  if (!itReady || !itAd) return;

  const ad = itAd;
  itAd = null;
  itReady = false;
  lastShown = Date.now();

  await new Promise<void>((resolve) => {
    const done = () => {
      offClosed();
      offError();
      loadInterstitial();
      resolve();
    };
    const offClosed = ad.addAdEventListener(AdEventType.CLOSED, done);
    const offError = ad.addAdEventListener(AdEventType.ERROR, done);
    ad.show().catch(done);
  });
}
