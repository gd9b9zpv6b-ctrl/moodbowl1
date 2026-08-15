import { Redirect } from 'expo-router';

/**
 * Bridge merged into /ritual/release · keep route for old deep links.
 */
export default function RitualBridgeRedirect() {
  return <Redirect href="/ritual/release" />;
}
