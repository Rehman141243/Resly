api;
import api from "./apiClient";
import { AuthUser } from "./tokenStorage";

type SessionPayload = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
};

export const authService = {
  signUp: (fullName: string, email: string, password: string) =>
    api
      .post<{ user: AuthUser; session: SessionPayload | null }>("/auth/signup", {
        fullName,
        email,
        password,
      })
      .then((r) => r.data),

  login: (email: string, password: string) =>
    api
      .post<{ user: AuthUser; session: SessionPayload }>("/auth/login", { email, password })
      .then((r) => r.data),

  logout: () => api.post("/auth/logout").then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }).then((r) => r.data),

  resetPassword: (email: string, code: string, password: string) =>
    api.post("/auth/reset-password", { email, code, password }).then((r) => r.data),
};
