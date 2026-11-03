import { useState } from "react";
import { Alert, ScrollView, StatusBar, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import ScalePress from "../../components/common/ScalePress";
import ThemeToggle from "../../components/common/ThemeToggle";
import Reveal from "../../components/common/Reveal";
import EditProfileSheet from "../../components/profile/EditProfileSheet";
import ChangePasswordSheet from "../../components/profile/ChangePasswordSheet";
import Icon, { IconName } from "../../components/common/Icon";
import BottomSheet from "../../components/common/BottomSheet";
import { profileService } from "../../services/profileService";
import { getErrorMessage } from "../../services/apiClient";

import Avatar from "../../components/profile/Avatar";
import ImageCropPicker, { Image as CroppedImage } from "react-native-image-crop-picker";

const RED = "#EF4444";

const CROP_OPTIONS = {
  mediaType: "photo" as const,
  cropping: true,
  cropperCircle: true,
  width: 800,
  height: 800,
  compressImageQuality: 0.8,
  forceJpg: true,
  cropperToolbarTitle: "Adjust photo",
  cropperChooseText: "Done",
  cropperCancelText: "Cancel",
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mx-6 mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-muted dark:text-muted-dark">
      {children}
    </Text>
  );
}

function Row({
  icon,
  label,
  onPress,
  last,
  danger,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  last?: boolean;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <>
      <ScalePress scaleTo={0.985} onPress={onPress} className="flex-row items-center px-4 py-3.5">
        <View
          className={`h-9 w-9 items-center justify-center rounded-xl ${
            danger ? "bg-red-500/10" : "bg-brand/10 dark:bg-brand-dark/20"
          }`}
        >
          <Icon name={icon} size={18} color={danger ? RED : colors.brand} />
        </View>
        <Text
          className={`ml-3 flex-1 text-base ${
            danger
              ? "font-semibold text-red-500 dark:text-[#FF453A]"
              : "text-ink dark:text-ink-dark"
          }`}
        >
          {label}
        </Text>
        {!danger ? <Icon name="chevron-right" size={18} /> : null}
      </ScalePress>
      {!last ? <View className="ml-16 h-px bg-line dark:bg-line-dark" /> : null}
    </>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { dark, colors } = useTheme();
  const { user, signOut, refreshUser } = useAuth();

  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const email = user?.email ?? "";
  const name = user?.user_metadata?.full_name?.trim() || email.split("@")[0] || "Your account";
  const avatarUrl: string | undefined = user?.user_metadata?.avatar_url;

  const uploadCropped = async (img: CroppedImage) => {
    try {
      setUploading(true);
      const ext = img.mime === "image/png" ? "png" : "jpg";
      await profileService.uploadAvatar({
        uri: img.path,
        name: `avatar.${ext}`,
        type: img.mime || "image/jpeg",
      });
      await refreshUser();
    } catch (e) {
      Alert.alert("Upload failed", getErrorMessage(e, "Couldn't upload your photo. Try again."));
    } finally {
      setUploading(false);
      ImageCropPicker.clean().catch(() => undefined);
    }
  };

  const handlePickError = (e: any) => {
    if (e?.code === "E_PICKER_CANCELLED") return;
    const denied = e?.code === "E_NO_LIBRARY_PERMISSION" || e?.code === "E_NO_CAMERA_PERMISSION";
    Alert.alert(
      "Couldn't open photos",
      denied ? "Please allow access in your phone settings." : (e?.message ?? "Try again."),
    );
  };

  const fromGallery = () => {
    setPhotoOpen(false);
    setTimeout(() => {
      ImageCropPicker.openPicker(CROP_OPTIONS).then(uploadCropped).catch(handlePickError);
    }, 350);
  };

  const fromCamera = () => {
    setPhotoOpen(false);
    setTimeout(() => {
      ImageCropPicker.openCamera({ ...CROP_OPTIONS, useFrontCamera: true })
        .then(uploadCropped)
        .catch(handlePickError);
    }, 350);
  };

  const removePhoto = async () => {
    setPhotoOpen(false);
    try {
      setUploading(true);
      await profileService.removeAvatar();
      await refreshUser();
    } catch (e) {
      Alert.alert("Couldn't remove photo", getErrorMessage(e, "Try again."));
    } finally {
      setUploading(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <View className="flex-1 bg-[#F4F7FC] dark:bg-canvas-dark">
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 120 }}
      >
        <Reveal index={0}>
          <Text className="px-6 text-[32px] font-bold tracking-tight text-ink dark:text-ink-dark">
            Profile
          </Text>

          <View className="mx-6 mt-5 flex-row items-center rounded-[20px] bg-surface p-4 dark:bg-surface-dark">
            <ScalePress scaleTo={0.94} onPress={() => setPhotoOpen(true)}>
              <View>
                <Avatar
                  uri={avatarUrl}
                  initials={getInitials(name)}
                  size={68}
                  loading={uploading}
                />
                <View className="absolute -bottom-0.5 -right-0.5 h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand dark:border-[#1C1C1E] dark:bg-brand-dark">
                  <Icon name="camera" size={13} color="#FFFFFF" />
                </View>
              </View>
            </ScalePress>

            <View className="ml-4 flex-1">
              <Text numberOfLines={1} className="text-lg font-bold text-ink dark:text-ink-dark">
                {name}
              </Text>
              {email ? (
                <Text numberOfLines={1} className="mt-0.5 text-sm text-muted dark:text-muted-dark">
                  {email}
                </Text>
              ) : null}
            </View>

            <ScalePress
              onPress={() => setEditOpen(true)}
              className="h-10 w-10 items-center justify-center rounded-full bg-brand/10 dark:bg-brand-dark/20"
            >
              <Icon name="edit-2" size={17} color={colors.brand} />
            </ScalePress>
          </View>
        </Reveal>

        <Reveal index={1}>
          <SectionLabel>Account</SectionLabel>
          <View className="mx-6 overflow-hidden rounded-[20px] bg-surface dark:bg-surface-dark">
            <Row icon="user" label="Personal information" onPress={() => setEditOpen(true)} />
            <Row icon="lock" label="Change password" onPress={() => setPasswordOpen(true)} last />
          </View>

          <SectionLabel>Preferences</SectionLabel>
          <View className="mx-6 overflow-hidden rounded-[20px] bg-surface dark:bg-surface-dark">
            <View className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-row items-center">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand/10 dark:bg-brand-dark/20">
                  <Icon name={dark ? "moon" : "sun"} size={18} color={colors.brand} />
                </View>
                <Text className="ml-3 text-base text-ink dark:text-ink-dark">Appearance</Text>
              </View>
              <ThemeToggle />
            </View>
          </View>

          <View className="mx-6 mt-6 overflow-hidden rounded-[20px] bg-surface dark:bg-surface-dark">
            <Row icon="log-out" label="Log out" onPress={confirmLogout} last danger />
          </View>
        </Reveal>
      </ScrollView>

      <BottomSheet visible={photoOpen} onClose={() => setPhotoOpen(false)} title="Profile photo">
        <View className="overflow-hidden rounded-[20px] border border-line dark:border-line-dark">
          <Row icon="image" label="Choose from gallery" onPress={fromGallery} />
          <Row icon="camera" label="Take a photo" onPress={fromCamera} last={!avatarUrl} />
          {avatarUrl ? (
            <Row icon="trash-2" label="Remove photo" onPress={removePhoto} last danger />
          ) : null}
        </View>
      </BottomSheet>

      <EditProfileSheet visible={editOpen} onClose={() => setEditOpen(false)} />
      <ChangePasswordSheet visible={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </View>
  );
}
