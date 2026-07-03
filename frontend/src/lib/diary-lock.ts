// Simple session-only PIN memory. When user enters the PIN it stays "unlocked"
// until app is closed. Not persisted anywhere — never written to disk.

let unlocked = false;

export function isDiaryUnlocked() {
  return unlocked;
}

export function unlockDiary() {
  unlocked = true;
}

export function lockDiary() {
  unlocked = false;
}
