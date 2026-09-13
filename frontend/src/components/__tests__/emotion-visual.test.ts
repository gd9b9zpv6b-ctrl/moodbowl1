import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Image: {
    resolveAssetSource: (id: number) =>
      id === 7 ? { uri: 'https://example.test/happy.png', width: 40, height: 40 } : null,
  },
  StyleSheet: { create: (s: unknown) => s },
  View: () => null,
  Platform: { OS: 'web' },
}));

vi.mock('@expo/vector-icons', () => ({ Feather: () => null }));
vi.mock('react-native-svg', () => ({
  Svg: () => null,
  Ellipse: () => null,
  Path: () => null,
}));

import { resolveEmotionImageSource } from '@/src/components/emotion-visual';

describe('resolveEmotionImageSource', () => {
  it('turns a Metro require id into a uri so modal bowls stay PNGs', () => {
    expect(resolveEmotionImageSource(7)).toEqual({ uri: 'https://example.test/happy.png' });
  });

  it('passes through an already-resolved uri', () => {
    expect(resolveEmotionImageSource({ uri: 'https://cdn/bowl.png' })).toEqual({
      uri: 'https://cdn/bowl.png',
    });
  });

  it('returns null when there is no art', () => {
    expect(resolveEmotionImageSource(undefined)).toBeNull();
  });
});
