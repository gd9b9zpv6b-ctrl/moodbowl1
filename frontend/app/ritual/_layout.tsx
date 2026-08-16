import { Stack } from 'expo-router';

/**
 * Soft fades between ritual steps · less jarring than hard slides
 * for an emotional check-in flow.
 */
export default function RitualLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 280,
        gestureEnabled: true,
      }}
    />
  );
}
