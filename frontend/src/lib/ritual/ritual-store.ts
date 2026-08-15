import { create } from 'zustand';

import type { BodyChipKey } from '@/src/constants/body-chips';
import { MAX_BOWL_DECORS } from '@/src/constants/bowl-decorations';
import type { SoupKey } from '@/src/constants/soups';

export type BowlSize = 'S' | 'M' | 'L' | 'XL';
export type CheckInType = 'full' | 'hug_only' | 'skipped' | 'quick_diary';
export type AgeGroup = 'lower' | 'upper' | 'adult';

const MAX_CHIPS = 3;

type RitualState = {
  soup: SoupKey | null;
  bodyChips: BodyChipKey[];
  selectedBowlKey: string | null;
  /** @deprecated kept for older entries · prefer decorations */
  colorTint: string | null;
  decorations: string[];
  bowlSize: BowlSize;
  diaryText: string;
  checkInType: CheckInType;
  shareClass: boolean;
  shareFamily: boolean;
  shareTimeline: boolean;
  regulationUsed: string[];
  startedAt: number | null;
  ageGroup: AgeGroup;

  setSoup: (soup: SoupKey) => void;
  toggleChip: (chip: BodyChipKey) => void;
  setBowl: (key: string) => void;
  setTint: (hex: string | null) => void;
  toggleDecoration: (key: string) => void;
  clearDecorations: () => void;
  setSize: (size: BowlSize) => void;
  setDiaryText: (text: string) => void;
  setCheckInType: (type: CheckInType) => void;
  setShares: (shares: {
    shareClass?: boolean;
    shareFamily?: boolean;
    shareTimeline?: boolean;
  }) => void;
  addRegulation: (key: string) => void;
  skipChips: () => void;
  setAgeGroup: (ageGroup: AgeGroup) => void;
  reset: () => void;
};

const initialState = {
  soup: null as SoupKey | null,
  bodyChips: [] as BodyChipKey[],
  selectedBowlKey: null as string | null,
  colorTint: null as string | null,
  decorations: [] as string[],
  bowlSize: 'M' as BowlSize,
  diaryText: '',
  checkInType: 'full' as CheckInType,
  shareClass: false,
  shareFamily: false,
  shareTimeline: true,
  regulationUsed: [] as string[],
  startedAt: null as number | null,
  ageGroup: 'upper' as AgeGroup,
};

export const useRitualStore = create<RitualState>((set, get) => ({
  ...initialState,

  setSoup: (soup) =>
    set({
      soup,
      startedAt: get().startedAt ?? Date.now(),
    }),

  toggleChip: (chip) => {
    const current = get().bodyChips;
    if (current.includes(chip)) {
      set({ bodyChips: current.filter((c) => c !== chip) });
      return;
    }
    const next = [...current, chip];
    if (next.length > MAX_CHIPS) {
      next.shift();
    }
    set({ bodyChips: next });
  },

  setBowl: (key) => set({ selectedBowlKey: key }),
  setTint: (hex) => set({ colorTint: hex }),

  toggleDecoration: (key) => {
    const current = get().decorations;
    if (current.includes(key)) {
      set({ decorations: current.filter((k) => k !== key), colorTint: null });
      return;
    }
    const next = [...current, key];
    if (next.length > MAX_BOWL_DECORS) next.shift();
    set({ decorations: next, colorTint: null });
  },

  clearDecorations: () => set({ decorations: [], colorTint: null }),

  setSize: (size) => set({ bowlSize: size }),
  setDiaryText: (text) => set({ diaryText: text }),
  setCheckInType: (type) => set({ checkInType: type }),

  setShares: (shares) =>
    set((state) => ({
      shareClass: shares.shareClass ?? state.shareClass,
      shareFamily: shares.shareFamily ?? state.shareFamily,
      shareTimeline: shares.shareTimeline ?? state.shareTimeline,
    })),

  addRegulation: (key) => {
    const used = get().regulationUsed;
    if (used.includes(key)) return;
    set({ regulationUsed: [...used, key] });
  },

  skipChips: () => set({ bodyChips: [] }),

  setAgeGroup: (ageGroup) => set({ ageGroup }),

  reset: () =>
    set((state) => ({
      ...initialState,
      ageGroup: state.ageGroup,
    })),
}));
