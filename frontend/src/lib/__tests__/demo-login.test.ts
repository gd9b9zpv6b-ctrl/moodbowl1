import { beforeEach, describe, expect, it, vi } from 'vitest';

const { setSession } = vi.hoisted(() => ({
  setSession: vi.fn(),
}));

vi.mock('@/src/lib/supabase-client', () => ({
  supabase: { auth: { setSession } },
}));

const authUser = {
  id: 'student-1',
  email: 'student@demo.moodful.app',
  created_at: '2026-08-16T00:00:00.000Z',
  user_metadata: { display_name: '學生 A' },
};

describe('demo login session boundary', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    setSession.mockReset();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'access',
          refresh_token: 'refresh',
          user: authUser,
        }),
      }),
    );
  });

  it('returns a demo user only after Supabase confirms the session', async () => {
    setSession.mockResolvedValue({
      data: { session: { user: authUser } },
      error: null,
    });

    const { signInDemoAccount } = await import('@/src/lib/demo-login');
    const user = await signInDemoAccount(authUser.email, 'student');

    expect(setSession).toHaveBeenCalledWith({
      access_token: 'access',
      refresh_token: 'refresh',
    });
    expect(user.id).toBe(authUser.id);
    expect(user.role).toBe('student');
  });

  it('does not enter the app when session persistence fails', async () => {
    setSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'storage unavailable' },
    });

    const { signInDemoAccount } = await import('@/src/lib/demo-login');

    await expect(signInDemoAccount(authUser.email, 'student')).rejects.toThrow(
      '登入未完成 · 請再試一次',
    );
  });

  it('rejects a mismatched session instead of exposing another account', async () => {
    setSession.mockResolvedValue({
      data: { session: { user: { ...authUser, id: 'other-user' } } },
      error: null,
    });

    const { signInDemoAccount } = await import('@/src/lib/demo-login');

    await expect(signInDemoAccount(authUser.email, 'student')).rejects.toThrow(
      '登入未完成 · 請再試一次',
    );
  });
});
