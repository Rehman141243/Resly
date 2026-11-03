import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppStackParamList, AppTabParamList } from "../types/navigation";
import { useTheme } from "../context/ThemeContext";
import GlassTabBar from "../components/common/GlassTabBar";
import HomeScreen from "../screens/home/HomeScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import ResumeTemplatesScreen from "../screens/resume/ResumeTemplatesScreen";

import ResumesListScreen from "../screens/resume/ResumeListScreen";
import ResumeStartScreen from "../screens/resume/ResumeStartScreen";
import ResumeEditorScreen from "../screens/resume/ResumeEditScreen";
import ResumePreviewScreen from "../screens/resume/ResumePreviewScreen";
import ResumeAtsScreen from "../screens/resume/ResumeAtsScreen";
import ResumeImportScreen from "../screens/resume/ResumeImportScreen";
import ResumeImproveScreen from "../screens/resume/ResumeImproveScreen";
import ResumePickTemplateScreen from "../screens/resume/ResumePickTemplateScreen";

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Resumes" component={ResumesListScreen} />
      <Tab.Screen name="Templates" component={ResumeTemplatesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { dark } = useTheme();
  const bg = dark ? "#000000" : "#F2F2F7";

  return (
    <Stack.Navigator
      initialRouteName="Tabs"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: bg },
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="ResumeAts" component={ResumeAtsScreen} />
      <Stack.Screen name="ResumeStart" component={ResumeStartScreen} />
      <Stack.Screen name="ResumeImport" component={ResumeImportScreen} />
      <Stack.Screen name="ResumeImprove" component={ResumeImproveScreen} />
      <Stack.Screen name="ResumePickTemplate" component={ResumePickTemplateScreen} />
      <Stack.Screen name="ResumeEditor" component={ResumeEditorScreen} />
      <Stack.Screen name="ResumePreview" component={ResumePreviewScreen} />
    </Stack.Navigator>
  );
}
