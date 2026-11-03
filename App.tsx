

// // // import "./global.css";
// // // import { SafeAreaProvider } from "react-native-safe-area-context";
// // // import { AuthProvider } from "./src/context/AuthContext";
// // // import RootNavigator from "./src/roots/rootnavigation";
// // // import { ToastProvider } from "./src/context/ToastContext";
// // // import { useThemeBootstrap } from "./src/context/ThemeContext";

// // // function App() {
// // //   useThemeBootstrap();
// // //   return (
// // //     <SafeAreaProvider>
// // //       <ToastProvider>
// // //         <AuthProvider>
// // //           {/* <PremiumProvider> */}
// // //             <RootNavigator />
// // //           {/* </PremiumProvider> */}
// // //         </AuthProvider>
// // //       </ToastProvider>
// // //     </SafeAreaProvider>
// // //   );
// // // }

// // // export default App;


// // import React, { useEffect } from "react";

// // import "./global.css";

// // import { SafeAreaProvider } from
// //   "react-native-safe-area-context";

// // import { AuthProvider } from
// //   "./src/context/AuthContext";

// // import RootNavigator from
// //   "./src/roots/rootnavigation";

// // import { ToastProvider } from
// //   "./src/context/ToastContext";

// // import { useThemeBootstrap } from
// //   "./src/context/ThemeContext";
// // import { initAds } from "./src/utils/rewardads";

// // function App() {
// //   useThemeBootstrap();

// //   useEffect(() => {
// //     initAds().catch(error => {
// //       console.warn("Ad initialization error:", error);
// //     });
// //   }, []);

// //   return (
// //     <SafeAreaProvider>
// //       <ToastProvider>
// //         <AuthProvider>
// //           <RootNavigator />
// //         </AuthProvider>
// //       </ToastProvider>
// //     </SafeAreaProvider>
// //   );
// // }

// // export default App;



// import React, { useEffect } from "react";
// import "./global.css";

// import { SafeAreaProvider } from "react-native-safe-area-context";
// import { AuthProvider } from "./src/context/AuthContext";
// import RootNavigator from "./src/roots/rootnavigation";
// import { ToastProvider } from "./src/context/ToastContext";
// import { useThemeBootstrap } from "./src/context/ThemeContext";
// import { TemplateAccessProvider } from "./src/context/templateaccescontext";
// import { initAds } from "./src/utils/rewardads";

// function App() {
//   useThemeBootstrap();

//   useEffect(() => {
//     let mounted = true;

//     const initializeAds = async () => {
//       try {
//         const initialized = await initAds();

//         if (mounted) {
//           console.log(
//             initialized
//               ? "[AdMob] Ready"
//               : "[AdMob] Ads are not available yet"
//           );
//         }
//       } catch (error) {
//         console.warn("[AdMob] Initialization error:", error);
//       }
//     };

//     initializeAds();

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   return (
//     <SafeAreaProvider>
//       <ToastProvider>
//         <AuthProvider>
//           <TemplateAccessProvider>
//             <RootNavigator />
//           </TemplateAccessProvider>
//         </AuthProvider>
//       </ToastProvider>
//     </SafeAreaProvider>
//   );
// }

// export default App;


import { useEffect } from "react";
import "./global.css";

import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { ToastProvider } from "./src/context/ToastContext";
import { useThemeBootstrap } from "./src/context/ThemeContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { initAds } from "./src/services/rewardedAds";

export default function App() {
  useThemeBootstrap();

  useEffect(() => {
    initAds().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}