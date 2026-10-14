import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/types";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AuthNavigator from "../navigator/AuthNavigator";
import AppNavigator from "../navigator/AppNavigator";

const Root = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user } = useAuth() as { user?: unknown };
  const { dark } = useTheme();

  const theme = dark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: "#000000" } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: "#F4F7FC" } };

  return (
    <NavigationContainer theme={theme}>
      <Root.Navigator screenOptions={{ headerShown: false, animation: "fade", animationDuration: 350 }}>
        {user ? (
          <Root.Screen name="App" component={AppNavigator} />
        ) : (
          <Root.Screen name="Auth" component={AuthNavigator} options={{ animationTypeForReplace: "pop" }} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}