/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeBaseProvider, Box, extendTheme, Input } from "native-base";
import Login from './src/components/Login/Login';
import Welcome from './src/components/Welcome/Welcome';
import Otp from './src/components/Login/Otp';
import Register from './src/components/Register/Register';
import VerifyOtp from './src/components/Register/VerifyOtp';
import Home from './src/components/Dashboard/Home';
import Dashboard from './src/components/Dashboard/Dashboard';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Account from './src/components/Profile/Account';
import EditProfile from './src/components/Profile/EditProfile';
import Payment from './src/components/Order/Payment';
import PaymentSuccess from './src/components/Order/PaymentSuccess';
import PaymentFailed from './src/components/Order/PaymentFailed';
import Notification from './src/components/Dashboard/Notification';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function App(): React.JSX.Element {

  useEffect(() => {
    const interval = setInterval(async () => {
      const keysToRemove = [
        "HomeBanner",
        "DropDownStorage",
        "ActiveList1Storage",
        "ActiveList2Storage",
        "ActiveList3Storage",
        "BrandProductStorage",
      ];

      try {
        await Promise.all(keysToRemove.map(key => AsyncStorage.removeItem(key)));
      } catch (error) {
        console.error("Error removing items from AsyncStorage:", error);
      }
    }, 60 * 10000); // Check every 1 minute

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const theme = extendTheme({
    components: {
      Input: {
        baseStyle: {
          _focus: {
            _android: {
              borderColor: "none",
              backgroundColor: "FFFFFF"
            }
          }
        }
      }
    }
  })

  return (
    <NativeBaseProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Welcome" screenOptions={{
          headerShown: false
        }}>
          <Stack.Screen name="Welcome" component={Welcome} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Otp" component={Otp} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="VerifyOtp" component={VerifyOtp} />
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="Payment" component={Payment} />
          <Stack.Screen name="PaymentSuccess" component={PaymentSuccess} />
          <Stack.Screen name="PaymentFailed" component={PaymentFailed} />
          <Stack.Screen name="Notification" component={Notification} />
        </Stack.Navigator>

      </NavigationContainer>
    </NativeBaseProvider>
  );
}

export default App;
