import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { LogBox, Text as RNText } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useDiaryFonts, UI_FONT } from '@/src/hooks/use-diary-fonts';
import { useIconFonts } from '@/src/hooks/use-icon-fonts';
import { AuthProvider } from '@/src/lib/auth-context';

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

// Apply Noto Sans TC as the default UI font — cross-platform consistent Chinese.
// Respects weight: fontWeight >= 600 uses the bold face automatically.
type TextWithDefaults = typeof RNText & { defaultProps?: { style?: unknown } };
const AnyText = RNText as TextWithDefaults;
const origRender = AnyText.render;
if (!AnyText.__moodfulPatched && typeof origRender === 'function') {
  AnyText.__moodfulPatched = true;
  AnyText.defaultProps = AnyText.defaultProps || {};
  const prevStyle = AnyText.defaultProps.style;
  AnyText.defaultProps.style = [{ fontFamily: UI_FONT.regular }, prevStyle];
}

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
