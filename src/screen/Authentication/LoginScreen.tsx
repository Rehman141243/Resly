import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../types/types";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "../../components/AuthLayout";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Icon from "../../constant/icon";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false); // TODO: persist session when true
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      setLoading(true);
      await signIn(email.trim(), password);
    } catch {
      setErrors({ form: "Email or password is incorrect." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Login with email address"
      subtitle="Welcome back. Enter your details to continue."
      background={require("../../../assets/LoginBg.png")}
  
      footer={
        <View className="flex-row">
          <Text className="text-muted dark:text-muted-dark">Don't have an account? </Text>
          <Pressable onPress={() => navigation.navigate("SignUp")} hitSlop={8}>
            <Text className="font-semibold text-brand dark:text-brand-dark">Sign up</Text>
          </Pressable>
        </View>
      }
    >
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
        autoComplete="password"
        placeholder="Your password"
      />

      <View className="mb-8 mt-1 flex-row items-center justify-between">
        <Pressable onPress={() => setRemember((r) => !r)} hitSlop={8} className="flex-row items-center">
          <View
            className={`h-5 w-5 items-center justify-center rounded-md border ${
              remember ? "border-brand bg-brand" : "border-line bg-surface dark:border-line-dark dark:bg-surface-dark"
            }`}
          >
            {remember ? <Icon name="check" size={14} color="#FFFFFF" /> : null}
          </View>
          <Text className="ml-2 text-sm text-muted dark:text-muted-dark">Remember me</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate("ForgotPassword")} hitSlop={8}>
          <Text className="text-sm font-medium text-brand dark:text-brand-dark">Forgot password?</Text>
        </Pressable>
      </View>

      {errors.form ? <Text className="mb-3 text-center text-sm text-red-500 dark:text-red-400">{errors.form}</Text> : null}
      <Button title="Continue" onPress={submit} loading={loading} />
    </AuthLayout>
  );
}