/**
 * Counsellor triage · 緊急 vs 需要跟進
 *
 * Product rules:
 * 🔴 緊急（建議即刻介入）
 *   - 日記危機字眼
 *   - 社群 post 因危機字被攔截
 *   - 身心安全信號（例如連續多日負面 + 身體不適字詞）
 *
 * 🟡 需要跟進（觀察／約見）
 *   - 打卡中斷或頻率大跌
 *   - 情緒急轉（正面 → 負面）
 *   - 系統負面提示（碗大細／處理方式 · 同老師版概括一致）
 *   - 「想老師留意」通知（輔導層跟進 · 仍唔顯示日記細節）
 *   - 社群 post 因攻擊／粗口被攔截（非危機字）
 *
 * Privacy: triage never exposes diary body · only signal kind + coarse label.
 */

export type CounsellorPriority = 'urgent' | 'follow_up';

export type CounsellorSignalKind =
  | 'crisis_keyword'
  | 'blocked_crisis_post'
  | 'blocked_profanity_post'
  | 'safety_somatic'
  | 'checkin_absent'
  | 'checkin_drop'
  | 'emotion_swing'
  | 'bowl_watch'
  | 'teacher_notify';

export const COUNSELLOR_TRIAGE_COPY: Record<
  CounsellorSignalKind,
  { priority: CounsellorPriority; label: string; hint: string }
> = {
  crisis_keyword: {
    priority: 'urgent',
    label: '日記出現危機字眼',
    hint: '建議即刻介入 · 唔預設顯示日記原文',
  },
  blocked_crisis_post: {
    priority: 'urgent',
    label: '出 post 被攔截 · 危機字',
    hint: '建議即刻介入',
  },
  safety_somatic: {
    priority: 'urgent',
    label: '身心安全信號',
    hint: '連續負面 + 身體不適等信號 · 建議即刻介入',
  },
  blocked_profanity_post: {
    priority: 'follow_up',
    label: '出 post 被攔截 · 攻擊／粗口',
    hint: '需要跟進 · 非危機字',
  },
  checkin_absent: {
    priority: 'follow_up',
    label: '打卡中斷',
    hint: '之前有打卡習慣 · 近日缺席',
  },
  checkin_drop: {
    priority: 'follow_up',
    label: '打卡頻率下降',
    hint: '使用習慣異常 · 值得約見了解',
  },
  emotion_swing: {
    priority: 'follow_up',
    label: '情緒急轉',
    hint: '正面轉負面 · 需要跟進',
  },
  bowl_watch: {
    priority: 'follow_up',
    label: '系統負面提示',
    hint: '根據感覺強度／處理方式 · 唔顯示細節',
  },
  teacher_notify: {
    priority: 'follow_up',
    label: '學生想老師留意',
    hint: '通知式提示 · 唔顯示日記／情緒細節',
  },
};

export const COUNSELLOR_RULE_SUMMARY = {
  urgent: '危機字眼 · 攔截危機 post · 身心安全信號',
  follow_up: '打卡異常 · 情緒急轉 · 系統負面提示 · 想老師留意 · 粗口攔截',
} as const;

export type CounsellorCaseInput = {
  id: string;
  name: string;
  className: string;
  signal: CounsellorSignalKind;
  /** Days since signal · for display only */
  days?: number;
};

export type CounsellorCase = CounsellorCaseInput & {
  priority: CounsellorPriority;
  reason: string;
  sev: 'high' | 'mid' | 'low';
};

export function triageSignal(signal: CounsellorSignalKind): CounsellorPriority {
  return COUNSELLOR_TRIAGE_COPY[signal].priority;
}

export function triageApiAlert(alert: {
  alert_type?: 'crisis_keyword' | 'blocked_crisis_post' | 'blocked_profanity_post' | string | null;
  matched_crisis?: string[] | null;
}): CounsellorPriority {
  const type = alert.alert_type;
  if (type === 'blocked_crisis_post' || type === 'crisis_keyword') return 'urgent';
  if (type === 'blocked_profanity_post') return 'follow_up';
  // Legacy / unknown · treat crisis keyword hits as urgent
  if (alert.matched_crisis && alert.matched_crisis.length > 0) return 'urgent';
  return 'urgent';
}

export function apiAlertToSignal(alert: {
  alert_type?: 'crisis_keyword' | 'blocked_crisis_post' | 'blocked_profanity_post' | string | null;
}): CounsellorSignalKind {
  if (alert.alert_type === 'blocked_crisis_post') return 'blocked_crisis_post';
  if (alert.alert_type === 'blocked_profanity_post') return 'blocked_profanity_post';
  return 'crisis_keyword';
}

export function buildCounsellorCase(input: CounsellorCaseInput): CounsellorCase {
  const meta = COUNSELLOR_TRIAGE_COPY[input.signal];
  const priority = meta.priority;
  return {
    ...input,
    priority,
    reason: meta.label,
    sev: priority === 'urgent' ? 'high' : input.signal === 'checkin_drop' ? 'low' : 'mid',
  };
}

export function splitCounsellorCases(cases: CounsellorCaseInput[]): {
  urgent: CounsellorCase[];
  followUp: CounsellorCase[];
} {
  const built = cases.map(buildCounsellorCase);
  return {
    urgent: built.filter((c) => c.priority === 'urgent'),
    followUp: built.filter((c) => c.priority === 'follow_up'),
  };
}
