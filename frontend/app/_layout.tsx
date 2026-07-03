import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useDiaryFonts } from '@/src/hooks/use-diary-fonts';
import { useIconFonts } from '@/src/hooks/use-icon-fonts';
import { AuthProvider } from '@/src/lib/auth-context';

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [iconsLoaded, iconsError] = useIconFonts();
  const [diaryLoaded, diaryError] = useDiaryFonts();
  const loaded = iconsLoaded && diaryLoaded;
  const error = iconsError || diaryError;

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
