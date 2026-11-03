import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_URL } from "../config/env";
import { StoredSession, tokenStorage } from "./tokenStorage";

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const baseConfig = {
  baseURL: `${API_URL}`,
  timeout: 19000,
  headers: {
    "Content-Type": "application/json",
  },
};

const api = axios.create(baseConfig);
const raw = axios.create(baseConfig);

let onAuthFailure: (() => void) | null = null;
export const setAuthFailureHandler = (fn: (() => void) | null) => {
  onAuthFailure = fn;
};

const isAuthRoute = (url?: string) => !!url && url.startsWith("/auth/");

let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const gen = tokenStorage.generation();
      const session = await tokenStorage.load();
      if (!session?.refresh_token) throw new Error("NO_REFRESH_TOKEN");

      const { data } = await raw.post("/auth/refresh", { refreshToken: session.refresh_token });

      if (gen !== tokenStorage.generation()) throw new Error("SESSION_CLEARED");

      await tokenStorage.save({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: data.user ?? session.user,
      });

      return data.session.access_token as string;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

const isSessionDead = (e: unknown) => {
  if (e instanceof Error && e.message === "NO_REFRESH_TOKEN") return true;
  const status = (e as AxiosError)?.response?.status;
  return status === 400 || status === 401 || status === 403;
};

const handleDead = async (e: unknown) => {
  if (isSessionDead(e)) {
    await tokenStorage.clear();
    onAuthFailure?.();
  }
};

export const getValidAccessToken = async (): Promise<string | null> => {
  const session = await tokenStorage.load();
  if (!session) return null;

  const now = Math.floor(Date.now() / 1000);
  const expiringSoon = session.expires_at !== undefined && session.expires_at - now < 30;
  if (!expiringSoon) return session.access_token;

  try {
    return await refreshAccessToken();
  } catch (e) {
    await handleDead(e);
    return null;
  }
};

api.interceptors.request.use(async (config) => {
  if (config.url === "/auth/logout") {
    const s = await tokenStorage.load();
    if (s) config.headers.Authorization = `Bearer ${s.access_token}`;
    return config;
  }
  if (isAuthRoute(config.url)) return config;

  const token = await getValidAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthRoute(original.url)
    ) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (e) {
        await handleDead(e);
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

export const getErrorMessage = (e: unknown, fallback = "Something went wrong.") => {
  const err = e as AxiosError<{ message?: string }>;
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === "ECONNABORTED" || err?.message === "Network Error") {
    return "Can't reach the server. Check your connection.";
  }
  return fallback;
};

export const restoreSession = async (): Promise<StoredSession | null> => {
  const session = await tokenStorage.load();
  if (!session) return null;

  const now = Math.floor(Date.now() / 1000);
  const needsRefresh = session.expires_at !== undefined && session.expires_at - now < 60;
  if (!needsRefresh) return session;

  try {
    await refreshAccessToken();
    return await tokenStorage.load();
  } catch (e) {
    if (isSessionDead(e)) {
      await tokenStorage.clear();
      return null;
    }
    return session;
  }
};

export default api;
