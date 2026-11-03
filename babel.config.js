module.exports = {
    presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
    plugins: [
      'react-native-worklets/plugin',
      'module:react-native-dotenv'

    ],

 
  };



// module.exports = {
//   presets: [
//     'module:@react-native/babel-preset',
//     'nativewind/babel',
//   ],
//   plugins: [
//     'react-native-worklets-core/plugin',
//     'react-native-worklets/plugin',
//   ],
// };
