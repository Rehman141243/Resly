import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import BottomSheet from "../common/BottomSheet";
import Input from "../Input";
import Button from "../Button";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { profileService } from "../../services/profileService";
import { getErrorMessage } from "../../services/apiClient";

export default function DeleteAccountSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { signOut } = useAuth();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setPassword("");
      setError(undefined);
    }
  }, [visible]);

  const submit = async () => {
    if (!password) {
      setError("Enter your password to confirm.");
      return;
    }
    try {
      setLoading(true);
      await profileService.deleteAccount(password);
      onClose();
      toast.success("Account deleted");
      await signOut();
    } catch (e) {
      setError(getErrorMessage(e, "Couldn't delete your account. Try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Delete account"
      subtitle="This permanently deletes your account, resumes and photo. It cannot be undone."
    >
      <Input
        label="Password"
        icon="lock"
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          setError(undefined);
        }}
        error={error}
        secureTextEntry
        autoComplete="password"
        placeholder="Your password"
      />
      <View className="mt-3">
        <Button title="Delete my account" onPress={submit} loading={loading} />
      </View>
    </BottomSheet>
  );
}
