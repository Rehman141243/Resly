import api from "./apiClient";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url?: string | null;
};

export type PickedImage = { uri: string; name: string; type: string };

export const profileService = {
  get: () => api.get<{ profile: Profile }>("/profile").then((r) => r.data.profile),

  update: (payload: { fullName?: string; email?: string; currentPassword?: string }) =>
    api.put<{ profile: Profile }>("/profile", payload).then((r) => r.data.profile),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put("/profile/change-password", { currentPassword, newPassword }).then((r) => r.data),

  uploadAvatar: (image: PickedImage) => {
    const form = new FormData();
    form.append("avatar", image as any);
    return api
      .put<{ profile: Profile }>("/profile/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      })
      .then((r) => r.data.profile);
  },

  removeAvatar: () =>
    api.delete<{ profile: Profile }>("/profile/avatar").then((r) => r.data.profile),

  deleteAccount: (password: string) =>
    api.delete("/profile/account", { data: { password } }).then((r) => r.data),
};
