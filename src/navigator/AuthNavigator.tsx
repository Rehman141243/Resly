import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthStackParamList } from "../types/types";
import LoginScreen from "../screen/Authentication/LoginScreen";
import SignUpScreen from "../screen/Authentication/SignUpScreen";
import ForgotPasswordScreen from "../screen/Authentication/ForgetPassword";
import ResetPasswordScreen from "../screen/Authentication/ResetPassword";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        // animation: "slide_from_right",
        // contentStyle: { backgroundColor: "#1B9AAA" },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}