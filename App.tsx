// import "./global.css";
// import { ReactNode, useEffect, useRef } from "react";
// import {
//   Animated,
//   Easing,
//   Pressable,
//   ScrollView,
//   StatusBar,
//   Text,
//   View,
// } from "react-native";
// import {
//   SafeAreaProvider,
//   useSafeAreaInsets,
// } from "react-native-safe-area-context";

// /* ---------- Data ---------- */

// const QUICK_ACTIONS = [
//   { label: "Import", icon: "⬆️" },
//   { label: "Templates", icon: "🗂️" },
//   { label: "Cover letter", icon: "✉️" },
// ];

// const RESUMES = [
//   { title: "Product Designer", edited: "Edited today", score: 92 },
//   { title: "Frontend Developer", edited: "Edited 3 days ago", score: 84 },
//   { title: "Marketing Lead", edited: "Edited last week", score: 71 },
// ];

// const TABS = ["Home", "Resumes", "Profile"];

// /* ---------- Animation helpers ---------- */

// // Page-load entrance. Sections rise in one after another, once.
// function Reveal({ index, children }: { index: number; children: ReactNode }) {
//   const v = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     Animated.timing(v, {
//       toValue: 1,
//       duration: 520,
//       delay: index * 90,
//       easing: Easing.out(Easing.cubic),
//       useNativeDriver: true,
//     }).start();
//   }, [index, v]);

//   return (
//     <Animated.View
//       style={{
//         opacity: v,
//         transform: [
//           {
//             translateY: v.interpolate({
//               inputRange: [0, 1],
//               outputRange: [14, 0],
//             }),
//           },
//         ],
//       }}
//     >
//       {children}
//     </Animated.View>
//   );
// }

// // Press feedback: shrinks slightly like native iOS controls.
// function ScalePress({
//   children,
//   className,
//   onPress,
// }: {
//   children: ReactNode;
//   className?: string;
//   onPress?: () => void;
// }) {
//   const s = useRef(new Animated.Value(1)).current;

//   const to = (toValue: number) =>
//     Animated.spring(s, {
//       toValue,
//       speed: 40,
//       bounciness: 0,
//       useNativeDriver: true,
//     }).start();

//   return (
//     <Pressable
//       onPress={onPress}
//       onPressIn={() => to(0.96)}
//       onPressOut={() => to(1)}
//     >
//       <Animated.View style={{ transform: [{ scale: s }] }}>
//         <View className={className}>{children}</View>
//       </Animated.View>
//     </Pressable>
//   );
// }

// /* ---------- Hero: resume being written by AI ---------- */

// const PAPER_LINES = [0.9, 0.62, 1, 0.78, 0.5];

// function WritingPaper() {
//   const lines = useRef(PAPER_LINES.map(() => new Animated.Value(0))).current;
//   const badge = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     Animated.sequence([
//       Animated.delay(500),
//       Animated.stagger(
//         170,
//         lines.map((l) =>
//           Animated.timing(l, {
//             toValue: 1,
//             duration: 420,
//             easing: Easing.out(Easing.quad),
//             useNativeDriver: false, // animating width
//           })
//         )
//       ),
//       Animated.spring(badge, {
//         toValue: 1,
//         friction: 5,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, [lines, badge]);

//   return (
//     <View style={{ transform: [{ rotate: "-5deg" }] }}>
//       <View className="h-36 w-28 rounded-xl bg-white p-3">
//         <View className="mb-3 flex-row items-center">
//           <View className="h-6 w-6 rounded-full bg-teal" />
//           <View className="ml-2 h-1.5 flex-1 rounded-full bg-ink" />
//         </View>
//         {lines.map((l, i) => (
//           <Animated.View
//             key={i}
//             className="mb-2 h-1.5 rounded-full bg-stone"
//             style={{
//               width: l.interpolate({
//                 inputRange: [0, 1],
//                 outputRange: ["0%", `${PAPER_LINES[i] * 100}%`],
//               }),
//             }}
//           />
//         ))}
//       </View>

//       <Animated.View
//         className="absolute -right-2 -top-2 h-8 w-8 items-center justify-center rounded-full bg-teal"
//         style={{ opacity: badge, transform: [{ scale: badge }] }}
//       >
//         <Text className="text-sm text-white">✦</Text>
//       </Animated.View>
//     </View>
//   );
// }

// /* ---------- Screen ---------- */

// function AppContent() {
//   const insets = useSafeAreaInsets();

//   return (
//     <View className="flex-1 bg-cream">
//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{
//           paddingTop: insets.top + 12,
//           paddingBottom: insets.bottom + 110,
//         }}
//       >
//         {/* Large title */}
//         <Reveal index={0}>
//           <View className="flex-row items-center justify-between px-6">
//             <View>
//               <Text className="text-4xl font-bold text-ink">Resumes</Text>
//               <Text className="mt-1 text-base text-ink/50">
//                 3 saved, 1 needs review
//               </Text>
//             </View>
//             <View className="h-11 w-11 items-center justify-center rounded-full bg-stone">
//               <Text className="text-base font-semibold text-ink">A</Text>
//             </View>
//           </View>
//         </Reveal>

//         {/* Hero */}
//         <Reveal index={1}>
//           <View className="mx-6 mt-7 flex-row items-center overflow-hidden rounded-[32px] bg-ink p-6">
//             <View className="flex-1 pr-4">
//               <Text className="text-2xl font-bold leading-8 text-white">
//                 Write your resume with AI
//               </Text>
//               <Text className="mt-2 text-sm leading-5 text-white/60">
//                 Answer a few questions and get a finished draft in a minute.
//               </Text>
//               <ScalePress className="mt-5 self-start rounded-full bg-teal px-5 py-3">
//                 <Text className="text-base font-semibold text-white">
//                   Start with AI
//                 </Text>
//               </ScalePress>
//             </View>
//             <WritingPaper />
//           </View>
//         </Reveal>

//         {/* Quick actions */}
//         <Reveal index={2}>
//           <View className="mt-4 flex-row px-6">
//             {QUICK_ACTIONS.map((a, i) => (
//               <View key={a.label} className={i === 0 ? "flex-1" : "ml-3 flex-1"}>
//                 <ScalePress className="items-center rounded-[20px] border border-stone bg-white py-4">
//                   <View className="h-10 w-10 items-center justify-center rounded-full bg-cream">
//                     <Text className="text-lg">{a.icon}</Text>
//                   </View>
//                   <Text className="mt-2 text-sm font-medium text-ink">
//                     {a.label}
//                   </Text>
//                 </ScalePress>
//               </View>
//             ))}
//           </View>
//         </Reveal>

//         {/* Recent list */}
//         <Reveal index={3}>
//           <View className="mt-8 flex-row items-end justify-between px-6">
//             <Text className="text-xl font-bold text-ink">Recent</Text>
//             <Text className="text-base text-teal">See all</Text>
//           </View>

//           <View className="mx-6 mt-3 overflow-hidden rounded-[20px] border border-stone bg-white">
//             {RESUMES.map((r, i) => (
//               <View key={r.title}>
//                 <ScalePress className="flex-row items-center px-4 py-3.5">
//                   <View className="h-11 w-9 justify-center rounded-md border border-stone bg-cream px-1.5">
//                     <View className="mb-1 h-0.5 rounded bg-teal" />
//                     <View className="mb-1 h-0.5 rounded bg-stone" />
//                     <View className="h-0.5 w-1/2 rounded bg-stone" />
//                   </View>

//                   <View className="ml-3 flex-1">
//                     <Text className="text-base font-semibold text-ink">
//                       {r.title}
//                     </Text>
//                     <Text className="mt-0.5 text-sm text-ink/50">
//                       {r.edited}
//                     </Text>
//                   </View>

//                   <View className="rounded-full bg-teal/10 px-2.5 py-1">
//                     <Text className="text-sm font-semibold text-teal">
//                       {r.score}
//                     </Text>
//                   </View>
//                 </ScalePress>
//                 {i < RESUMES.length - 1 && (
//                   <View className="ml-[68px] h-px bg-stone/70" />
//                 )}
//               </View>
//             ))}
//           </View>
//         </Reveal>
//       </ScrollView>

//       {/* Tab bar */}
//       <View
//         className="absolute bottom-0 left-0 right-0 flex-row border-t border-stone bg-cream pt-2"
//         style={{ paddingBottom: insets.bottom + 4 }}
//       >
//         {TABS.map((t, i) => (
//           <View key={t} className="flex-1 items-center py-2">
//             <View
//               className={`mb-1 h-1 w-1 rounded-full ${
//                 i === 0 ? "bg-teal" : "bg-transparent"
//               }`}
//             />
//             <Text
//               className={`text-xs font-medium ${
//                 i === 0 ? "text-teal" : "text-ink/40"
//               }`}
//             >
//               {t}
//             </Text>
//           </View>
//         ))}
//       </View>
//     </View>
//   );
// }

// function App() {
//   return (
//     <SafeAreaProvider>
//       <StatusBar barStyle="dark-content" backgroundColor="#F5F1E3" />
//       <AppContent />
//     </SafeAreaProvider>
//   );
// }

// export default App;


import "./global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import RootNavigator from "./src/roots/rootnavigation";

export default function App() {
  return (
    <SafeAreaProvider>
      
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}