import { Platform } from "react-native";
import Config from "react-native-config";

const url =
  Platform.OS === "android"
    ? Config.API_URL_ANDROID || Config.API_URL
    : Config.API_URL_IOS || Config.API_URL;

if (!url) {
  throw new Error("API URL missing. Check your .env file and rebuild the app.");
}

if (!__DEV__ && !url.startsWith("https://")) {
  throw new Error("Production API URL must use https.");
}

export const API_URL = url.replace(/\/$/, "");

export const APP_ENV = (Config.APP_ENV ?? (__DEV__ ? "development" : "production")) as
  "development" | "staging" | "production";

export const isProd = APP_ENV === "production";

export const TERMS_URL = Config.TERMS_URL ?? "";
export const PRIVACY_URL = Config.PRIVACY_URL ?? "";

export const ADMOB_REWARDED_ANDROID = Config.ADMOB_REWARDED_ANDROID ?? "";
export const ADMOB_REWARDED_IOS = Config.ADMOB_REWARDED_IOS ?? "";
export const ADMOB_INTERSTITIAL_ANDROID = Config.ADMOB_INTERSTITIAL_ANDROID ?? "";
export const ADMOB_INTERSTITIAL_IOS = Config.ADMOB_INTERSTITIAL_IOS ?? "";
export const ADMOB_BANNER_ANDROID = Config.ADMOB_BANNER_ANDROID ?? "";
export const ADMOB_BANNER_IOS = Config.ADMOB_BANNER_IOS ?? "";

export const ADS_TEST_MODE = !isProd && Config.ADS_TEST_MODE === "true";
