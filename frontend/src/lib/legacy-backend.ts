/**
 * Legacy FastAPI compatibility layer.
 * Phase 1+ uses Supabase Auth/data; EXPO_PUBLIC_BACKEND_URL is often empty.
 * Student-critical flows must not depend on this being online.
 */

const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || '').trim();

export function isLegacyBackendConfigured(): boolean {
  return BASE_URL.length > 0;
}

export function legacyBackendOfflineMessage(feature = '呢個功能'): string {
  return `${feature}暫時未接上伺服器 · 試用版請用日記／月曆／私隱匯出`;
}
