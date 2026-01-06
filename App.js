import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Font from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NativeStack from './navigation/NativeStack';
import { UserProvider } from './context/UserContext';
import { LanguageProvider } from './context/LanguageContext';

import { AuthProvider } from './context/AuthContext';
import { initDatabase } from './services/database';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const GamingTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0A0E27', // Match Auth background
    card: '#0A0E27',
    text: '#FFFFFF',
  },
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize SQLite
        await initDatabase();

        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync(MaterialCommunityIcons.font);
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately!
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LanguageProvider>
          <UserProvider>
            <View style={styles.appContainer} onLayout={onLayoutRootView}>
              <NavigationContainer theme={GamingTheme}>
                <StatusBar style="light" backgroundColor="#0A0E27" translucent />
                <NativeStack />
              </NavigationContainer>
            </View>
          </UserProvider>
        </LanguageProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#0A0E27', // The absolute safety net
  },
});
