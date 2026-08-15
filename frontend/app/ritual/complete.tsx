import { Redirect } from 'expo-router';

/** Legacy route · smile/home now lives on `/ritual/release` after save. */
export default function RitualCompleteScreen() {
  return <Redirect href="/(tabs)" />;
}
