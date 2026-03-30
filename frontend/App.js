import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import AppScreen from './screens/AppScreen';
import SignupScreen from './screens/SignupScreen';
import SigninScreen from './screens/SigninScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import ChatScreen from './screens/ChatScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createStackNavigator();

const getSubdomain = () => {
  if (Platform.OS === 'web') {
    const hostname = window.location.hostname;
    if (hostname.startsWith('auth.')) return 'auth';
    if (hostname.startsWith('app.')) return 'app';
    if (hostname.startsWith('global.')) return 'global';
  }
  return 'home';
};

const subdomain = getSubdomain();

const getAuthInitialRoute = () => {
  if (Platform.OS === 'web') {
    const path = window.location.pathname;
    if (path.includes('signup')) return 'Signup';
    if (path.includes('reset-password')) return 'ResetPassword';
  }
  return 'Signin';
};

function GlobalApp() {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Read auth from URL hash (coming from auth subdomain)
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const userId = hash.get('userId');
      const token = hash.get('token');
      if (userId && token) {
        localStorage.setItem('v4u_userId', userId);
        localStorage.setItem('v4u_token', token);
        window.history.replaceState(null, '', '/');
        setAuth({ userId: parseInt(userId), token });
        setLoading(false);
      } else {
        const savedUserId = localStorage.getItem('v4u_userId');
        const savedToken = localStorage.getItem('v4u_token');
        if (savedUserId && savedToken) {
          setAuth({ userId: parseInt(savedUserId), token: savedToken });
          setLoading(false);
        } else {
          window.location.href = 'https://auth.v4u.ai/signin';
        }
      }
    }
  }, []);

  if (loading || !auth) {
    return (
      <View style={globalStyles.loading}>
        <ActivityIndicator size="large" color="#00897B" />
        <Text style={globalStyles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Chat" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Chat" component={ChatScreen} initialParams={auth} />
        <Stack.Screen name="Settings" component={SettingsScreen} initialParams={{ token: auth.token }} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const globalStyles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  loadingText: { marginTop: 12, color: '#888', fontSize: 16 },
});

export default function App() {
  if (subdomain === 'global') {
    return <GlobalApp />;
  }

  if (subdomain === 'auth') {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName={getAuthInitialRoute()} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Signin" component={SigninScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    );
  }

  if (subdomain === 'app') {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AppPage" component={AppScreen} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    );
  }

  // Default: v4u.ai home
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
