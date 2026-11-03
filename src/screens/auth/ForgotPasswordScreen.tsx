import { useState } from "react";
import { Text } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../types/navigation";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import AuthLayout from "../../components/AuthLayout";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { getErrorMessage } from "../../services/apiClient";
import { EMAIL_RE } from "../../utils/getInitials";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { requestPasswordReset } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      toast.error("Enter a valid email");
      return;
    }
    setError(undefined);
    try {
      setLoading(true);
      await requestPasswordReset(email.trim());
      toast.success("Reset code sent");
      navigation.navigate("ResetPassword", { email: email.trim() });
    } catch (e) {
      toast.error(getErrorMessage(e, "We couldn't send the code. Try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="We'll email you a code to reset it."
      background={require("../../../assets/ForgetpassBg.png")}
      onBack={() => navigation.goBack()}
    >
      <Input
        label="Email address"
        icon="mail"
        value={email}
        onChangeText={setEmail}
        onClear={() => setEmail("")}
        error={error}
        keyboardType="email-address"
        autoComplete="email"
        placeholder="you@example.com"
      />
      <Text className="mb-8 ml-1 text-sm text-muted dark:text-muted-dark">
        Use the email address you signed up with.
      </Text>
      <Button title="Send reset code" onPress={submit} loading={loading} />
    </AuthLayout>
  );
}
