import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../types/navigation";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "../../components/AuthLayout";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { getErrorMessage } from "../../services/apiClient";
import { useToast } from "../../context/ToastContext";
import { EMAIL_RE, passwordError } from "../../utils/getInitials";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

type Errors = { name?: string; email?: string; password?: string; confirm?: string; form?: string };

export default function SignUpScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Enter your full name.";
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    const pwErr = passwordError(password);
    if (pwErr) next.password = pwErr;
    if (confirm !== password) next.confirm = "Passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      setLoading(true);
      const { needsConfirmation } = await signUp(name.trim(), email.trim(), password);

      if (needsConfirmation) {
        toast.success("Check your email", `We sent a confirmation to ${email.trim()}.`);
        navigation.navigate("Login");
      }
    } catch (e) {
      const msg = getErrorMessage(e, "Couldn't create your account. Try again.");
      setErrors({ form: msg });
      toast.error("Sign up failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Join FitConnect and find your training crew."
      background={require("../../../assets/SignUpBg.png")}
      onBack={() => navigation.goBack()}
      footer={
        <View className="flex-row">
          <Text className="text-muted dark:text-muted-dark">Already have an account? </Text>
          <Pressable onPress={() => navigation.navigate("Login")} hitSlop={8}>
            <Text className="font-semibold text-brand dark:text-brand-dark">Log in</Text>
          </Pressable>
        </View>
      }
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
      <Input
        label="Password"
        icon="lock"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
        autoComplete="new-password"
        placeholder="At least 8 characters"
      />
      <Input
        label="Confirm password"
        icon="shield"
        value={confirm}
        onChangeText={setConfirm}
        error={errors.confirm}
        secureTextEntry
        autoComplete="new-password"
        placeholder="Repeat your password"
      />

      {errors.form ? (
        <Text className="mb-3 text-center text-sm text-red-500 dark:text-[#FF453A]">
          {errors.form}
        </Text>
      ) : null}
      <View className="mt-4">
        <Button title="Create account" onPress={submit} loading={loading} />
      </View>
    </AuthLayout>
  );
}
