import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import { AccessProvider } from "../context/AccessContext";
import { ActivityIndicator, View } from "react-native";

const Root = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const { dark } = useTheme();

  const theme = dark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: "#000000" } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: "#F4F7FC" } };
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={dark ? "#0A84FF" : "#3B82F6"} />
      </View>
    );
  }
  return (
    <AccessProvider userId={user?.id ?? null}>
      <NavigationContainer theme={theme}>
        <Root.Navigator
          screenOptions={{ headerShown: false, animation: "fade", animationDuration: 350 }}
        >
          {user ? (
            <Root.Screen name="App" component={AppNavigator} />
          ) : (
            <Root.Screen
              name="Auth"
              component={AuthNavigator}
              options={{ animationTypeForReplace: "pop" }}
            />
          )}
        </Root.Navigator>
      </NavigationContainer>
    </AccessProvider>
  );
}
