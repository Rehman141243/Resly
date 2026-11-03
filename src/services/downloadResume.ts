import { Alert, Platform } from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";
import { getValidAccessToken } from "./apiClient";
import { apiError, resumeDownloadUrl } from "./resumeService";

export type DownloadResult = "ok" | "locked" | "error";

export async function downloadResume(resumeId: string, title?: string): Promise<DownloadResult> {
  try {
    const token = await getValidAccessToken();
    if (!token) throw new Error("Your session expired. Please log in again.");

    const safe =
      (title || "resume")
        .replace(/[^\w\- ]+/g, "")
        .trim()
        .replace(/\s+/g, "_") || "resume";

    const res = await ReactNativeBlobUtil.config({ fileCache: true, appendExt: "pdf" }).fetch(
      "GET",
      resumeDownloadUrl(resumeId),
      { Authorization: `Bearer ${token}` },
    );

    const status = res.info().status;
    if (status !== 200) {
      let code: string | undefined;
      let msg: string | undefined;
      try {
        const j = JSON.parse(await res.text());
        code = j?.code;
        msg = j?.error || j?.message;
      } catch {}
      await res.flush();
      if (status === 403 && code === "TEMPLATE_LOCKED") return "locked";
      throw new Error(
        status === 429
          ? "Too many downloads. Try again in a minute."
          : status === 503
            ? "The server is busy. Try again in a moment."
            : msg || `Server error ${status}`,
      );
    }

    if (Platform.OS === "android") {
      await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
        { name: `${safe}.pdf`, parentFolder: "", mimeType: "application/pdf" },
        "Download",
        res.path(),
      );
      await res.flush();
      Alert.alert("Saved", "Your PDF is in the Downloads folder.");
    } else {
      ReactNativeBlobUtil.ios.openDocument(res.path());
    }
    return "ok";
  } catch (e) {
    Alert.alert("Download failed", (e as Error)?.message || apiError(e));
    return "error";
  }
}
