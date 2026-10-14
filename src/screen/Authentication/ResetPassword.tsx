import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../types/types";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "../../components/AuthLayout";
import Input from "../../components/Input";
import Button from "../../components/Button";

type Props = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { resetPassword } = useAuth();
  const email = route.params?.email ?? "";
  const [code, setCode] = useState(route.params?.token ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!code.trim()) next.code = "Enter the code from your email.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (confirm !== password) next.confirm = "Passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      setLoading(true);
      await resetPassword(email, code.trim(), password);
      Alert.alert("Password updated", "Log in with your new password.");
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch {
      setErrors({ form: "That code is invalid or has expired." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle={email ? `Enter the code we sent to ${email}.` : "Enter the code from your email."}
      background={require("../../../assets/ResetPassBg.png")}
      onBack={() => navigation.goBack()}
    >
      <Input
        label="Reset code"
        icon="hash"
        value={code}
        onChangeText={setCode}
        onClear={() => setCode("")}
        error={errors.code}
        keyboardType="number-pad"
        placeholder="6-digit code"
      />
      <Input
        label="New password"
        icon="lock"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
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
        placeholder="Repeat your password"
      />

      {errors.form ? <Text className="mb-3 text-center text-sm text-red-500">{errors.form}</Text> : null}
      <View className="mt-4">
        <Button title="Update password" onPress={submit} loading={loading} />
      </View>
    </AuthLayout>
  );
}