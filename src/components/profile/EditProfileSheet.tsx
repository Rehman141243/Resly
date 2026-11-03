import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import BottomSheet from "../common/BottomSheet";
import Input from "../Input";
import Button from "../Button";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/apiClient";
import { profileService } from "../../services/profileService";
import { EMAIL_RE } from "../../utils/getInitials";

type Errors = { name?: string; email?: string; password?: string; form?: string };

export default function EditProfileSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { user, refreshUser } = useAuth();
  const currentName = user?.user_metadata?.full_name ?? "";
  const currentEmail = user?.email ?? "";

  const [name, setName] = useState(currentName);
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(currentName);
      setEmail(currentEmail);
      setPassword("");
      setErrors({});
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const nameChanged = name.trim() !== currentName;
  const emailChanged = email.trim().toLowerCase() !== currentEmail.toLowerCase();

  const submit = async () => {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Enter your full name.";
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (emailChanged && !password) next.password = "Enter your current password.";
    setErrors(next);
    if (Object.keys(next).length) return;

    if (!nameChanged && !emailChanged) {
      onClose();
      return;
    }

    const payload: { fullName?: string; email?: string; currentPassword?: string } = {};
    if (nameChanged) payload.fullName = name.trim();
    if (emailChanged) {
      payload.email = email.trim();
      payload.currentPassword = password;
    }

    try {
      setLoading(true);
      await profileService.update(payload);
      await refreshUser().catch(() => undefined);
      onClose();
      Alert.alert("Profile updated", "Your changes have been saved.");
    } catch (e) {
      setErrors({ form: getErrorMessage(e, "Couldn't update your profile. Try again.") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Edit profile"
      subtitle="Update the name and email on your account."
    >
      <Input
        label="Full name"
        icon="user"
        value={name}
        onChangeText={setName}
        onClear={() => setName("")}
        error={errors.name}
        autoCapitalize="words"
        autoComplete="name"
        placeholder="Your name"
      />
      <Input
        label="Email address"
        icon="mail"
        value={email}
        onChangeText={setEmail}
        onClear={() => setEmail("")}
        error={errors.email}
        keyboardType="email-address"
        autoComplete="email"
        placeholder="you@example.com"
      />

      {emailChanged ? (
        <>
          <Input
            label="Current password"
            icon="lock"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry
            autoComplete="password"
            placeholder="Needed to change your email"
          />
          <Text className="mb-2 ml-1 text-sm text-muted dark:text-muted-dark">
            For your security we ask for your password when the email changes.
          </Text>
        </>
      ) : null}

      {errors.form ? (
        <Text className="mb-3 text-center text-sm text-red-500 dark:text-red-400">
          {errors.form}
        </Text>
      ) : null}

      <View className="mt-3">
        <Button title="Save changes" onPress={submit} loading={loading} />
      </View>
    </BottomSheet>
  );
}
