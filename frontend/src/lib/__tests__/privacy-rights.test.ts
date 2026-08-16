import { describe, expect, it } from 'vitest';

import type { PrivacyExportBundle } from '@/src/lib/privacy-rights';

describe('PDPO export bundle shape', () => {
  it('documents required access fields for data subject portability', () => {
    const sample: PrivacyExportBundle = {
      exported_at: '2026-08-16T00:00:00.000Z',
      scheme: 'moodbowl-pdpo-export-v1',
      note: 'test',
      user: {
        id: 'u1',
        email: 'a@b.c',
        display_name: 'A',
        role: 'student',
        class_name: null,
        school_id: null,
      },
      entries: [{ id: 'd1' }],
      tasks: [],
      regulation_history: [],
      reactions: [],
      alerts_about_me: [],
    };
    expect(sample.scheme).toBe('moodbowl-pdpo-export-v1');
    expect(sample.entries).toHaveLength(1);
    expect(sample.user.email).toBeTruthy();
  });
});
