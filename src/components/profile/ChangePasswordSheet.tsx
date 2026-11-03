import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import BottomSheet from "../common/BottomSheet";
import Input from "../Input";
import Button from "../Button";
import { profileService } from "../../services/profileService";
import { getErrorMessage } from "../../services/apiClient";
import { passwordError } from "../../utils/getInitials";

type Errors = { current?: string; next?: string; confirm?: string; form?: string };

export default function ChangePasswordSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrent("");
      setNext("");
      setConfirm("");
      setErrors({});
    }
  }, [visible]);

  const submit = async () => {
    const e: Errors = {};
    if (!current) e.current = "Enter your current password.";
    const pwErr = passwordError(next);
    if (pwErr) e.next = pwErr;
    else if (next === current) e.next = "New password must be different.";
    if (confirm !== next) e.confirm = "Passwords don't match.";
    setErrors(e);
    if (Object.keys(e).length) return;

    try {
      setLoading(true);
      await profileService.changePassword(current, next);
      onClose();
      Alert.alert("Password changed", "Use your new password next time you log in.");
    } catch (err) {
      setErrors({ form: getErrorMessage(err, "Couldn't change your password. Try again.") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Change password"
      subtitle="Choose a strong password you don't use elsewhere."
    >
      <Input
        label="Current password"
        icon="lock"
        value={current}
        onChangeText={setCurrent}
        error={errors.current}
        secureTextEntry
        autoComplete="password"
        placeholder="Your current password"
      />
      <Input
        label="New password"
        icon="key"
        value={next}
        onChangeText={setNext}
        error={errors.next}
        secureTextEntry
        autoComplete="new-password"
        placeholder="At least 8 characters"
      />
      <Input
        label="Confirm new password"
        icon="shield"
        value={confirm}
        onChangeText={setConfirm}
        error={errors.confirm}
        secureTextEntry
        autoComplete="new-password"
        placeholder="Repeat your new password"
      />

      {errors.form ? (
        <Text className="mb-3 text-center text-sm text-red-500 dark:text-red-400">
          {errors.form}
        </Text>
      ) : null}

      <View className="mt-3">
        <Button title="Update password" onPress={submit} loading={loading} />
      </View>
    </BottomSheet>
  );
}
