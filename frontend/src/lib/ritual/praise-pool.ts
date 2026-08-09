export type PraiseCtx = {
  totalEntries: number;
  weekEntries: number;
  daysSinceLast: number;
  isNewBowlThisMonth?: boolean;
};

export function pickPraise({
  totalEntries,
  weekEntries,
  daysSinceLast,
  isNewBowlThisMonth,
}: PraiseCtx): string {
  const pool: string[] = ['你今日肯打開呢個 app · 呢件事本身好勇敢'];

  if (totalEntries <= 1) {
    pool.push('第一次同碗打招呼 · 精靈記住咗 🍚');
  }
  if (weekEntries >= 3) {
    pool.push(`你今個星期已經同自己坐咗 ${weekEntries} 次 🌱`);
  }
  if (daysSinceLast >= 2) {
    pool.push(`你上次隔咗 ${daysSinceLast} 日 · 但你返嚟咗 · 好嘢`);
  }
  if (totalEntries >= 5) {
    pool.push(`已經 ${totalEntries} 次選擇對自己溫柔啲 · 好棒`);
  }
  if (isNewBowlThisMonth) {
    pool.push('今日精靈遇到你新一面');
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
