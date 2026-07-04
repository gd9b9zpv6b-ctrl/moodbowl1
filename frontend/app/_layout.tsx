import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { LogBox, Platform, Text as RNText } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useDiaryFonts, UI_FONT } from '@/src/hooks/use-diary-fonts';
import { useIconFonts } from '@/src/hooks/use-icon-fonts';
import { AuthProvider } from '@/src/lib/auth-context';

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

// === Push notification module-scope setup ===
// Foreground display + Android channel · must exist BEFORE any component mounts
// so pushes arriving while the app is opening are still handled correctly.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
  }).catch(() => { /* channel may already exist · noop */ });
}

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
  const router = useRouter();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Push tap handlers · warm (app open) + cold-start (app was killed)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const routeFrom = (data: any) => {
      const url = data?.deeplink || data?.action_url;
      if (!url) return;
      if (typeof url === 'string' && url.startsWith('http')) {
        Linking.openURL(url).catch(() => {});
      } else if (typeof url === 'string') {
        router.push(url as any);
      }
    };

    const tapSub = Notifications.addNotificationResponseReceivedListener((response) => {
      routeFrom(response.notification.request.content.data);
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) routeFrom(response.notification.request.content.data);
    }).catch(() => {});

    return () => {
      tapSub.remove();
    };
  }, [router]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
