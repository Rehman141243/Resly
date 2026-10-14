import { Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AppTabParamList } from "../types/types";
import Icon, { IconName } from "../constant/icon";
import GlassTabBar from "../components/common/GlassTabBar";
import HomeScreen from "../screen/Home/HomeScreen";
import ProfileScreen from "../screen/Home/Profilescreen";

const Tab = createBottomTabNavigator<AppTabParamList>();

function ComingSoon({ title, icon }: { title: string; icon: IconName }) {
  return (
    <View className="flex-1 items-center justify-center bg-[#F4F7FC] dark:bg-canvas-dark">
      <Icon name={icon} size={36} />
      <Text className="mt-3 text-xl font-bold text-ink dark:text-ink-dark">{title}</Text>
      <Text className="mt-1 text-sm text-muted dark:text-muted-dark">Coming soon</Text>
    </View>
  );
}

const ResumesScreen = () => <ComingSoon title="My resumes" icon="file-text" />;
const TemplatesScreen = () => <ComingSoon title="Templates" icon="layout" />;

export default function AppNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // screens ka content bar ke peeche tak jaye, isi se glass dikhta hai
        tabBarStyle: { position: "absolute", backgroundColor: "transparent", borderTopWidth: 0, elevation: 0 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Resumes" component={ResumesScreen} />
      <Tab.Screen name="Templates" component={TemplatesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}