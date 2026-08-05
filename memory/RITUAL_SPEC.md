# MoodBowl · Ritual System · Implementation Spec

> **Status** · Approved · 2026-07-04 · Ready to implement
> **Audience** · Next implementation agent · Full-stack Expo + FastAPI
> **Read these first** ·
> 1. `/app/memory/DESIGN_PRINCIPLES.md` — visual/UX rules
> 2. `/app/memory/RITUAL_PSYCH_THEORY.md` — psychology grounding
> 3. This document — what to build

---

## 🎯 One-line summary

Replace the current 49-emotion grid with a **3-stage playful ritual**:
1. **Show** current state via food/body metaphor (bypass alexithymia)
2. **Regulate** with mood-matched exercises (help user reach connectable state)
3. **Bridge** to others · fully opt-in · privacy-first

The 40+ existing bowls remain the visual soul — L1+L2 answers **filter** them to 6 candidates.

---

## 🏗️ Architecture Overview

```
[Home tab]
   ↓ tap "今日打卡"
[Ritual Screen · Multi-step wizard]
   ↓ step through
[L1 · Soup]        →  [L2 · Body chips]  →  [L3 · Pick bowl]
   ↓                        ↓                       ↓
   Scoring updates          Scoring updates         Candidate list rendered
   ↓                        ↓                       ↓
                            [Bowl customize]  →  [Diary text]  →  [Regulation]
                                                        ↓            ↓
                                                        Reward color effects
                                                                     ↓
                                                              [Bridge/Share]
                                                                     ↓
                                                              [Save entry]
                                                                     ↓
                                                              [Completion praise]
```

Every step **can be skipped** if user hits X · escape hatches are honored (see § 6).

---

## 📐 Screen-by-Screen Spec

### Screen 0 · Ritual entry (Home Screen)

**Location** · `/app/frontend/app/(tabs)/index.tsx`
**Change** · Replace the current 49-grid with:
```
[今日 affirmation · random 一句 · 舊 feature]
[大 CTA · "同碗打招呼 · 3 分鐘 🍚"]  ← 主入口 · pill button
[細 link · "直接寫日記" ]                ← escape · 直入 free-form diary
[細 link · "睇心情圖鑑" ]                ← calendar mode
```

**TestID** · `home-ritual-start-btn` · `home-diary-quick-btn` · `home-album-btn`

---

### Screen 1 · L1 · Soup

**Path** · `/app/frontend/app/ritual/soup.tsx` (new)
**Progress dots** · `● ○ ○` (1/3)
**Header** · `Feather chevron-left` back-btn (returns to home · confirms save-draft?) + title *「你今日想食邊碗湯？」*

**Layout** · Grid 2×3 · 6 soup cards
```
🍵 熱奶茶       🥤 凍檸茶       🍛 咖喱
🥣 白粥         🍨 甜湯         🍽️ 唔想食
```

**Per card**
- Emoji 40pt · SVG steam animation (Reanimated · 3s loop · random offset)
- Label · 15/700 textPrimary
- Sub · 11/500 textSecondary (age-adapted · see § 4)
- Tap · haptic light · shrink to 96% · card border-glow COLORS.primary
- Selected → auto-navigate to L2 (300ms delay for visual confirmation)

**Backend impact** · none · state in Zustand `ritualStore`

**Age-adapted subs**

| Soup | Lower (P1-P3) | Upper (P4-P6) |
|---|---|---|
| 🍵 熱奶茶 | 舒服 warm warm | 想 hug 一下嗰種暖暖地 |
| 🥤 凍檸茶 | 淡淡地 | 心裡面有啲距離感 |
| 🍛 咖喱 | 熱辣辣 有火 | 有嘢頂住 · 想爆 |
| 🥣 白粥 | 冇特別 | 空落落嘅感覺 |
| 🍨 甜湯 | 好想食甜嘢 | 想 celebrate 啲嘢 |
| 🍽️ 唔想食 | 冇胃口 | 吞唔落嘅感覺 |

---

### Screen 2 · L2 · Body chips

**Path** · `/app/frontend/app/ritual/body.tsx`
**Progress dots** · `● ● ○`
**Title** · *「望下你嘅身體 · 邊度有 feel? 揀最多 3 樣」*

**Layout**
- Center · placeholder bowl avatar (240x240) · 唔預先揀 · 用「你之後會揀嘅碗預留位」灰底 SVG placeholder
- Chips · scrollable horizontal cluster · 10 chips · multi-select

**10 chips (final)**
1. 🌟 胸口暖暖
2. 💨 胸口悶悶
3. 💓 心跳好快
4. 🍥 肚仔嘟嘟
5. 🪨 頭重重
6. 🕺 好想跳
7. 🐚 縮埋一團
8. 💧 眼濕濕
9. 🫥 手軟軟
10. 🪶 輕飄飄

**Chip state**
- Idle · bgInput · textSecondary · borderRadius pill
- Hover · slight bump
- Selected · primary tint bg · textPrimary · Feather check-icon left
- Cap at 3 · 4th tap disables 1st (LRU) · toast 「揀 3 樣就夠啦」

**Visual reactivity (KEY UX moment)** · Every chip selection triggers overlay animation on placeholder bowl:
| Chip | Bowl animation |
|---|---|
| 胸口暖暖 | Chest area glows warm pink · fades in/out |
| 胸口悶悶 | Small grey cloud drifts across chest |
| 心跳好快 | Bowl pulses fast 120bpm |
| 肚仔嘟嘟 | Belly area wiggles |
| 頭重重 | Bowl tilts down slightly |
| 好想跳 | Bowl bounces up/down |
| 縮埋一團 | Bowl scales to 80% |
| 眼濕濕 | Tear droplet animation at eye |
| 手軟軟 | Wobble sideways |
| 輕飄飄 | Slow vertical drift |

**Next CTA** · Pill button *「準備見碗 →」* · disabled until ≥1 chip
**Skip** · `Skip →` link top-right · directly go to Screen 3 with empty chips (still get candidates from L1 alone)

---

### Screen 3 · L3 · Pick bowl (candidates)

**Path** · `/app/frontend/app/ritual/pick.tsx`
**Progress dots** · `● ● ●`
**Title** · *「你今日似邊個? 揀一個」*

**Layout · Default view**
```
┌────────────────────────────────┐
│  [碗 1]  [碗 2]  [碗 3]         │
│  [碗 4]  [碗 5]  [樹洞 🌰]      │  ← 3x2 grid · 6 candidates · 一樣大
├────────────────────────────────┤
│  ▼ 唔啱心水? 睇多啲 (12)         │  ← Expand toggle
└────────────────────────────────┘
```

**Layout · Expanded**
```
┌────────────────────────────────┐
│  [Top 6 · same]                 │
├────────────────────────────────┤
│  ▲ 收埋                          │
│  [碗 7-18 · scrollable]         │  ← Up to 12 more · vertical scroll
├────────────────────────────────┤
│  · 冇一個 fit? [睇全部 48 個 ⋯]  │  ← Safety net · opens full 49-grid mode
└────────────────────────────────┘
```

**Bowl card**
- Aspect 1:1 · borderRadius `md`
- BG · category tint (COLORS.primaryLight etc · low opacity 30%)
- 60% area · bowl PNG
- Below · label 13/700 · description 11/400 secondary
- Tap · haptic medium · scale-to-fill animation → go Screen 4

**TestID** · `bowl-pick-<key>` · `bowl-expand-toggle` · `bowl-see-all`

---

### Screen 4 · Customize

**Path** · `/app/frontend/app/ritual/customize.tsx`
**Progress dots** · none (past ritual · in decoration mode) · Small back arrow

**Title** · *「幫 [碗 label] 打扮一下」*

**Layout**
```
┌────────────────────────────────┐
│    [大大隻 bowl · 240x240]      │  ← Live preview · tint + scale applied
│                                 │
├────────────────────────────────┤
│  顏色                            │
│  [8 圓形 color chips · 一行]     │  ← Tap to apply tint
├────────────────────────────────┤
│  大細                            │
│  [ S ] [ M ] [ L ] [ XL ]       │  ← Segmented control
├────────────────────────────────┤
│  [ 下一步 · 同碗傾偈 → ]         │
└────────────────────────────────┘
```

**8 colors** (healing palette)
```
#FBEBEB  玫瑰粉
#EAF2E6  薄荷綠
#FEF9E7  淡黃
#EEE0F0  淡紫
#E9F0F8  天空藍
#F3E9D8  蜂蜜金
#FFFFFF  米白 (no tint)
#DDD7CE  灰
```

**Size mapping**
- S · 0.75×  · "淡淡地"
- M · 1.0×  · "一般" (default)
- L · 1.25× · "好強烈"
- XL · 1.5×  · "巨型"

**Implementation** · overlay `View` with `backgroundColor + opacity 0.35` on top of bowl PNG · size via `transform: [{ scale }]`

**v2 · not now** · steam effect (5 options · sparkle/heart/rain/light/fire) · leave scaffolding

**TestID** · `customize-color-<hex>` · `customize-size-<S/M/L/XL>` · `customize-next-btn`

---

### Screen 5 · L3.5 · Talk to bowl (diary)

**Path** · `/app/frontend/app/ritual/talk.tsx`
**Title** · *「[碗 label] 想知你今日發生咩事 · 講俾佢聽 🌱」*

**Layout**
```
┌─────────────────────────────────┐
│  [Customized bowl · 160x160]     │
│  精靈 speech · 「我聽緊 · 慢慢講」│
├─────────────────────────────────┤
│  [ TextInput · multi-line · 大]  │
│  「一個字都得 · 或者好長都 ok」  │
├─────────────────────────────────┤
│  🌈 已寫 [X] 字 · [tier hint]    │  ← Live progress
├─────────────────────────────────┤
│  [ 寫完啦 · 餵佢食 ]              │
│  [ 今日靜靜哋 · 得個抱 ]          │  ← Escape · no keyword logged
└─────────────────────────────────┘
```

**Character reward tiers** (real-time overlay on bowl)
| Chars | Effect |
|---|---|
| 0 | Bowl idle animation |
| 1-10 | Single color dot appears at bowl base |
| 11-30 | Gentle color gradient on bowl body |
| 31-60 | Rainbow ring circles bowl once |
| 61-100 | Sparkle particles emit steadily |
| 100+ | "深度傾訴" badge award + sustained sparkle |

**Animation implementation** · Reanimated · per-tier interpolate on `characterCount`

**"今日靜靜哋" escape** · skip diary · entry saved with `check_in_type: 'hug_only'` · `diary_text: null` · no keyword scan runs

**TestID** · `talk-textarea` · `talk-submit-btn` · `talk-hug-only-btn`

---

### Screen 6 · Regulation (nervous-system-adaptive)

**Path** · `/app/frontend/app/ritual/regulate.tsx`
**Title dynamic** · based on detected state

**State detection logic** (compute from L1+L2)
```ts
function detectState(soup, chips): NSState {
  if (soup === '咖喱' || chips.includes('心跳好快') && chips.includes('胸口悶悶'))
    return 'sympathetic_fire';           // 嬲/激動
  if (soup === '唔想食' || chips.includes('縮埋一團') || chips.includes('眼濕濕'))
    return 'dorsal_sad';                 // 傷心/低能量
  if (soup === '白粥' || chips.includes('頭重重') && chips.includes('手軟軟'))
    return 'dorsal_freeze';              // 麻木
  if (chips.includes('心跳好快') && chips.includes('肚仔嘟嘟'))
    return 'sympathetic_anxious';        // 焦慮
  if (soup === '甜湯' || soup === '熱奶茶')
    return 'ventral_regulated';          // 平靜/開心
  return 'unspoken';                     // fallback
}
```

**Content pool per state (all Tier 1 · pure code)**
| State | 2-3 activities (user picks) |
|---|---|
| 🔥 sympathetic_fire | (1) **4-7-8 呼吸圈** · (2) **Punch bag tap game** · (3) **搖手機 shake to release** |
| 💧 dorsal_sad | (1) **Affirmation slideshow** · (2) **溫柔音樂 loop** · (3) **可愛動物照片 slideshow (Pexels streamed)** |
| 🌪️ sympathetic_anxious | (1) **Box breathing 4-4-4-4** · (2) **5-4-3-2-1 grounding** · (3) **冷水面部提示** |
| 🌫️ dorsal_freeze | (1) **五感 activation** · (2) **輕輕伸個懶腰引導** · (3) **環境音（雨聲/貓咕嚕）** |
| 🌈 ventral_regulated | (1) **寫 3 樣今日靚嘢** · (2) **想同邊個講** · (3) **繼續呼吸 savor** |
| 🌰 unspoken | (1) **同碗坐一坐（純呼吸）** · (2) **淡淡地音樂** · (3) **直接 skip** |

**Screen layout**
```
┌───────────────────────────────┐
│  [碗 · 大 · 動畫貼合狀態]       │
│  「看落你[狀態描述] · 試下呢啲?」│
├───────────────────────────────┤
│  [ 活動 1 · icon + label ]     │
│  [ 活動 2 · icon + label ]     │
│  [ 活動 3 · icon + label ]     │
├───────────────────────────────┤
│  [ 唔洗 · 我 OK ]              │  ← Skip regulation
└───────────────────────────────┘
```

**Activity implementation** · Each activity opens a nested modal · full-screen · 純自製 · 完成 back to Screen 6 with checkmark

**Implementation details for key activities**

- **4-7-8 呼吸圈** · Reanimated circle scales 1→2 over 4s (inhale) · pauses 7s · exhales 8s · 3 cycles · haptic on transitions
- **Box breathing** · Square outline traces 4-side path · 4s each side · 4 rounds
- **Punch bag** · Big SVG bag · tap fast counts hits · at 20/50/100 hits bag "explodes" with confetti · haptic per tap
- **5-4-3-2-1 grounding** · Step wizard: 5 things you see (type) → 4 you can touch → 3 you hear → 2 you smell → 1 you taste
- **Affirmation slideshow** · Auto-advance through 15 curated healing quotes · 5s each · swipe or auto · tap pause
- **溫柔音樂** · Streamed CC0 mp3 from Pixabay · `expo-audio` · single track · loop · volume slider

**All activities log to `regulation_used[]` field · 用 keys `breath_4_7_8`, `punch_bag`, `grounding_5_4_3_2_1`, `slideshow_affirmations`, `ambient_music`, `box_breathing`, `cold_face_hint`, `sensory_5`, `gentle_stretch`, `ambient_nature`, `savor_3_things`, `plan_reach_out`, `savor_breath`, `sit_with_bowl`, `soft_music`**

**TestID** · `regulate-activity-<key>` · `regulate-skip-btn`

---

### Screen 7 · Bridge · Optional share

**Path** · `/app/frontend/app/ritual/bridge.tsx`
**Title dynamic** · state-adapted (see § 5 B5 wording table)

**Layout**
```
┌───────────────────────────────┐
│  [完整裝飾好嘅碗 · 大]           │
│  「而家 feel 好返啲啦嘛?」       │  ← State-adapted phrasing
├───────────────────────────────┤
│  ⬜  想同人講嘢 · 派俾我班同學   │  ← All checkboxes OFF by default
│  ⬜  派俾家人（如果連咗）        │
│  ⬜  留返俾我自己 timeline       │  ← Timeline default TRUE
├───────────────────────────────┤
│  [ 完成啦 · 搞掂 ]              │
└───────────────────────────────┘
```

**Privacy defaults**
- `is_public: false` (community share OFF)
- `family_share: false`
- `is_secret: false` (personal timeline share ON — user can see own history)

**All shares are OPT-IN · never default TRUE**

**TestID** · `bridge-share-class` · `bridge-share-family` · `bridge-complete-btn`

---

### Screen 8 · Completion · Praise + smile

**Path** · `/app/frontend/app/ritual/complete.tsx`
**Auto-navigate here after Screen 7 · time on screen ~30s optional**

**Layout**
```
┌─────────────────────────────────┐
│                                  │
│    [裝飾好嘅碗 · 大大隻 · 200]    │
│                                  │
│    ✨ 你搞掂啦 🌸                 │
│                                  │
│    「你今日肯坐低同自己相處咗      │
│     [X 分鐘] · 好厲害 · 好棒 🌱」 │  ← Concrete praise
├─────────────────────────────────┤
│                                  │
│    對住碗笑一笑 · 3 秒            │
│    [face emoji · tap 3s]         │  ← Haptic build-up · sparkle release
│                                  │
├─────────────────────────────────┤
│    [累積讚語 · random pool 抽]    │
│                                  │
│    [ 回主頁 ]                    │
└─────────────────────────────────┘
```

**Cumulative praise pool** (random抽 · 條件式)
- Always: "你今日肯打開呢個 app · 呢件事本身好勇敢"
- If ≥3 entries in week: "你今個星期已經同自己坐咗 X 次 🌱"
- If returned after ≥2 day gap: "你上次隔咗兩日 · 但你返嚟咗 · 好嘢"
- If ≥5 total entries: "已經 X 次選擇對自己溫柔啲 · 好棒"
- If first entry ever: "第一次同碗打招呼 · 精靈記住咗 🍚"
- If tried a new bowl (never picked before): "今日精靈遇到你新一面"

**"對住碗笑" implementation**
- Circle button · press-and-hold 3s
- Progress ring fills · haptic every 500ms bump
- Complete → confetti particles + heart shower on bowl · haptic success
- **Skippable** · X in corner

**TestID** · `complete-smile-btn` · `complete-home-btn`

---

## 🧮 Bowl Selection Algorithm

**Location** · `/app/frontend/src/lib/ritual/bowl-scorer.ts` (new)

**Interface**
```ts
export function scoreBowls(
  soup: SoupKey,
  chips: BodyChip[],
  yesterdayBowlKey?: string
): { candidates: Emotion[]; expanded: Emotion[] };
```

**Step 1 · Category base score**
```ts
const SOUP_CATEGORY_SCORES: Record<SoupKey, Partial<Record<EmotionCategory, number>>> = {
  hot_milk_tea: { warm: 8, unspoken: 2, sad: 1, nervous: 1 },
  cold_lemon_tea: { sad: 6, unspoken: 4, nervous: 2, wound: 1 },
  curry: { anger: 8, nervous: 3, wound: 2 },
  plain_congee: { sad: 5, unspoken: 5, wound: 2, nervous: 1 },
  sweet_soup: { warm: 8, nervous: 2 },
  no_appetite: { sad: 6, wound: 5, unspoken: 2, nervous: 1, anger: 1 },
};
```

**Step 2 · Chip bowl score**
```ts
const CHIP_BOWL_SCORES: Record<BodyChip, string[]> = {
  chest_warm: ['happy','content','loved','calm','peaceful','supported','grateful'],
  chest_tight: ['suppressed','overwhelmed','trapped','in-pain','hollow','sad'],
  fast_heart: ['anxious','angry','furious','scared','restless','overwhelmed','empowered'],
  belly_flutter: ['anxious','uneasy','worried','content'],
  head_heavy: ['exhausted','foggy','unmotivated','numb','overwhelmed'],
  jumpy: ['happy','empowered','free','proud','restless','content'],
  curled_up: ['lonely','empty','scared','abandoned','hollow','ashamed','sad'],
  teary: ['sad','lonely','in-pain','in-agony','unloved','misunderstood','guilty','abandoned'],
  limp_arms: ['exhausted','numb','overwhelmed','uneasy','anxious'],
  floaty: ['peaceful','free','calm','empty','foggy'],
};
// each chip adds +5 to matched bowls
```

**Step 3 · Compute total score for each bowl**
```ts
function scoreOne(bowl: Emotion): number {
  let s = SOUP_CATEGORY_SCORES[soup][bowl.category] ?? 0;
  for (const chip of chips) {
    if (CHIP_BOWL_SCORES[chip].includes(bowl.key)) s += 5;
  }
  if (bowl.key === yesterdayBowlKey) s -= 3;      // Recency penalty
  return s;
}
```

**Step 4 · Rank and select**
```ts
const scored = EMOTIONS.map(b => ({ ...b, score: scoreOne(b) }))
                       .sort((a,b) => b.score - a.score);

// Hollow (樹洞) always in default 6
const hollow = scored.find(b => b.key === 'hollow')!;
const others = scored.filter(b => b.key !== 'hollow');

// Ensure at least 2 categories represented in default 5
const default5 = ensureDiversity(others.slice(0, 5), 2);

// Expanded pool: top-scored 18 from top 2 categories
const topCategories = getTopCategories(scored, 2);
const expanded12 = others
  .filter(b => topCategories.includes(b.category))
  .filter(b => !default5.includes(b))
  .slice(0, 12);

return {
  candidates: [...default5, hollow],      // 6 items
  expanded: expanded12,                    // 12 items (max)
};
```

**Diversity injection helper**
```ts
function ensureDiversity(top5: Emotion[], minCats: number): Emotion[] {
  const catsPresent = new Set(top5.map(b => b.category));
  if (catsPresent.size >= minCats) return top5;
  // Swap last item with highest-scoring bowl from a new category
  // ... (implementation detail)
}
```

**Testing** · scorer must be unit-testable · pure function · no side effects

---

## 🗄️ Backend Schema

**Collection · `entries`**  · add these fields (all optional to preserve existing data):

```py
class EntryModel(BaseModel):
    # ... existing fields ...
    soup: Optional[Literal['hot_milk_tea','cold_lemon_tea','curry','plain_congee','sweet_soup','no_appetite']] = None
    body_chips: List[str] = []                                # e.g. ['chest_tight','curled_up']
    bowl_color_tint: Optional[str] = None                      # hex e.g. '#FBEBEB' or null
    bowl_size: Optional[Literal['S','M','L','XL']] = 'M'
    bowl_steam: Optional[str] = None                          # reserved for v2 · always None v1
    regulation_used: List[str] = []                            # activity keys
    check_in_type: Literal['full','hug_only','skipped','quick_diary'] = 'full'
    time_spent_sec: Optional[int] = None                      # ritual duration
    smile_completed: bool = False                              # whether user pressed the smile at completion
    ritual_version: Optional[str] = 'v1'                       # for future migration
```

**Emotion selection** · continue writing to existing `emotions: [{key}]` field so old code doesn't break · usually 1 bowl per entry now (was multi).

**Backward compat** · old entries lack these fields · UI must handle `undefined` gracefully · calendar view still works.

**New endpoints** · none required v1 · existing `POST /api/entries` extended.

**New indexes**
```py
await db.entries.create_index([('user_id', 1), ('created_at', -1)])
await db.entries.create_index([('user_id', 1), ('check_in_type', 1)])
```

---

## 🎨 Regulation Activities · Detailed Implementation

Each activity is a small self-contained component in `/app/frontend/src/components/regulation/`.

### 1 · `breath-4-7-8.tsx`
- Full-screen bg `bgMain`
- Center: SVG circle · animated scale 1→2→2→1 over 19s cycle
- Text below: "吸氣" 4s · "停" 7s · "呼氣" 8s
- Haptic on each transition
- 3 cycles default · user can tap "多做一次" or "完成"
- ~50 lines Reanimated code

### 2 · `punch-bag.tsx`
- Full-screen · dark bg for contrast
- Big SVG punching bag centered
- Every tap · bag shakes · counter +1 · particle burst · light haptic
- At 20/50/100 hits · confetti explosion · praise text "你發洩得好 · 好啦" and back
- User can tap "夠啦" any time

### 3 · `grounding-5-4-3-2-1.tsx`
- 5-step wizard
- Step 1: "你見到 5 樣嘢 · 打俾我聽" · 5 TextInputs (or 1 with 5 lines)
- Similar for 4-touch, 3-hear, 2-smell, 1-taste
- Progress dots at top
- End: "你已經返到 here-and-now 啦 🌱"
- All entries NOT saved to backend (grounding is private mental exercise)

### 4 · `box-breathing.tsx`
- SVG square outline · animated dot traces perimeter
- 4s inhale (top-left → top-right) · 4s hold · 4s exhale · 4s hold
- 4 rounds default

### 5 · `affirmation-slideshow.tsx`
- Auto-advancing card carousel · 5s per card
- 15 healing quotes from `/app/frontend/src/constants/affirmations.ts` (extend if needed)
- Tap pauses · swipe manual
- Card design · large text · soft bg · fade transition
- Fully offline · no network

### 6 · `ambient-music.tsx`
- Uses `expo-audio` streaming
- CC0 tracks (URL list in `/app/frontend/src/constants/ambient-tracks.ts`)
  - Rain · Cat purr · Wood crackle · Ocean · Cafe
- Simple play/pause · volume slider
- **Not preloaded** · streamed on demand

### 7 · `sensory-5.tsx`
- 5 activities that engage a sense
  - "揸下你件衫 · 摸下佢" (touch)
  - "聽下窗外邊有咩聲" (hear)
  - "望遠處 20 秒" (see)
  - etc.
- Just prompts · no interaction needed · self-paced

### 8 · `gentle-stretch.tsx`
- 3 stretches guided by illustrated diagrams
- Roll neck · roll shoulders · touch toes
- Timer per stretch (10s each)

### 9 · `nature-sounds.tsx`
- Same as ambient-music but with dedicated nature-only pool

### 10 · `savor-3-things.tsx`
- Simple 3-input form
- "今日有咩靚嘢?" x 3
- On complete · shows a small "感恩瓶" animation with 3 sparks added
- Saved to backend as `regulation_used: ['savor_3_things']` + optional text log

### 11 · `plan-reach-out.tsx`
- "而家想同邊個講嘢? 佢係邊個?"
- Free text · save to entry `reach_out_target` field (optional add)
- End: "諗定咗 · 你已經係 half-way there 🌱"

### 12 · `sit-with-bowl.tsx`
- Just the bowl · quiet animation (slow rise/fall)
- Optional bg music
- No goals · no timer
- "夠啦" button to exit

### 13 · `savor-breath.tsx`
- Similar to 4-7-8 but slower · 6s inhale, 6s exhale · pure enjoyment breathing

### 14 · `soft-music.tsx`
- Curated CC0 soft music track pool for happy/calm state

### 15 · `cold-face-hint.tsx`
- Static instructional card
- "去洗手間 · 用冷水拍下面 · 20 秒"
- Explains vagal nerve reflex simply

**Reusable components**
- `<ActivityHeader/>` with back and title
- `<HapticButton/>` for consistent tap feedback
- `<ProgressDots/>` for wizards

---

## 🎯 Age-Adapted Wording System

**Location** · `/app/frontend/src/lib/i18n/age-strings.ts`

```ts
type AgeGroup = 'lower' | 'upper';

export function getAgeGroup(user: User): AgeGroup {
  const cls = user.class_name?.toLowerCase() || '';
  // Match "P1"/"P2"/"P3" (or 一年級 · 二年級 · 三年級) → lower
  if (/^(p[1-3]|一年|二年|三年)/i.test(cls)) return 'lower';
  return 'upper';
}

export const STRINGS = {
  lower: {
    soup_title: '你今日想食咩湯?',
    body_title: '碗身體邊度有 feel?',
    pick_title: '你今日似邊個? 揀一個',
    diary_placeholder: '打幾隻字都得',
    // ... full string list
  },
  upper: {
    soup_title: '你今日想食邊碗湯?',
    body_title: '望下你嘅身體 · 邊度有 feel? 揀最多 3 樣',
    pick_title: '你今日似邊個? 揀一個',
    diary_placeholder: '一個字都得 · 或者好長都 ok',
  },
};
```

**Usage**
```tsx
const strings = STRINGS[getAgeGroup(user)];
<Text>{strings.soup_title}</Text>
```

**Coverage** · all user-facing wording that affects readability · soup subs · chip labels · title · praise · bridge language

---

## 🌉 Bridge Wording per State

| State | Lower (P1-P3) | Upper (P4-P6) |
|---|---|---|
| sympathetic_fire (嬲平復後) | 返返靜咗未呀? 想搵人講嗎? | 而家平靜返啲啦嘛? 想同人講咩發生咗咩事嗎? |
| dorsal_sad (傷心平復) | 感覺舒服返啲未? 想搵朋友嗎? | 而家 feel 冇咁重嗎? 想搵個朋友唞唞氣嗎? |
| sympathetic_anxious (焦慮平復) | 心跳慢返未? 有人陪一陣? | 而家心跳慢返嗎? 如果想有人陪住 · 想搵邊個? |
| dorsal_freeze (麻木回神) | 有 feel 番嗎? 講一句話都得 | 而家有啲返到自己嗎? 如果想同人講一句話 · 都得 |
| ventral_regulated (開心) | 想同人 share 嗎? | 今日呢種靚感覺 · 想派俾人一齊分享嗎? |
| unspoken (樹洞) | 留返俾自己都得 | 今日呢件事 · 留返俾自己都完全 OK |

---

## 🏆 Cumulative Praise Pool

**Location** · `/app/frontend/src/lib/ritual/praise-pool.ts`

```ts
export type PraiseCtx = {
  totalEntries: number;
  entriesThisWeek: number;
  daysSinceLastEntry: number;
  isFirstEver: boolean;
  isNewBowlThisMonth: boolean;
};

export function pickPraise(ctx: PraiseCtx): string {
  const pool: string[] = ['你今日肯打開呢個 app · 呢件事本身好勇敢'];
  if (ctx.isFirstEver) pool.push('第一次同碗打招呼 · 精靈記住咗 🍚');
  if (ctx.entriesThisWeek >= 3) pool.push(`你今個星期已經同自己坐咗 ${ctx.entriesThisWeek} 次 🌱`);
  if (ctx.daysSinceLastEntry >= 2) pool.push(`你上次隔咗 ${ctx.daysSinceLastEntry} 日 · 但你返嚟咗 · 好嘢`);
  if (ctx.totalEntries >= 5) pool.push(`已經 ${ctx.totalEntries} 次選擇對自己溫柔啲 · 好棒`);
  if (ctx.isNewBowlThisMonth) pool.push('今日精靈遇到你新一面 🌸');
  return pool[Math.floor(Math.random() * pool.length)];
}
```

**Rules**
- Never mention streaks like "連續 X 日" · always cumulative
- Never negative/shaming ("你 miss 咗一日" — 唔講)
- Always includes at least the base line

---

## 🗓️ Calendar / Album Integration

**Path** · `/app/frontend/app/(tabs)/calendar.tsx` (existing · extend)

**Add** · toggle button top-right "圖鑑 mode"
- **Calendar mode** (existing) · month grid · dot per day
- **Album mode** (new) · month grid · thumbnail of that day's customized bowl

**Album cell**
- Show `bowl_size + bowl_color_tint` applied to the bowl PNG
- Empty day · placeholder soft outline of a bowl
- Tap · opens same detail modal as calendar (existing `entry-detail-modal.tsx`)

**No new backend needed** · reads existing entries.

---

## 🎬 Route Structure

Add these new files:

```
/app/frontend/app/ritual/
  _layout.tsx          Stack navigator · headerShown false
  soup.tsx             L1
  body.tsx             L2
  pick.tsx             L3
  customize.tsx        Screen 4
  talk.tsx             Screen 5
  regulate.tsx         Screen 6 · dispatches to nested activities
  bridge.tsx           Screen 7
  complete.tsx         Screen 8

/app/frontend/src/lib/ritual/
  bowl-scorer.ts       Pure function scorer (unit-testable)
  ritual-store.ts      Zustand store for wizard state
  praise-pool.ts       Cumulative praise picker
  state-detector.ts    L1+L2 → nervous system state

/app/frontend/src/components/regulation/
  breath-4-7-8.tsx
  punch-bag.tsx
  grounding-5-4-3-2-1.tsx
  box-breathing.tsx
  affirmation-slideshow.tsx
  ambient-music.tsx
  ... (all 15 activities as separate files)

/app/frontend/src/constants/
  soups.ts             SoupKey types + labels
  body-chips.ts        BodyChip types + labels + animations
  bowl-color-tints.ts  8 tint hex codes
  ambient-tracks.ts    CC0 audio URLs
```

---

## 🧪 Testing Checklist

**Unit tests** · `/app/backend/tests/` (optional) · `/app/frontend/__tests__/` (if configured)
- `bowl-scorer.ts` · given (soup, chips) · always returns exactly 6 default + up to 12 expanded · 樹洞 always in default · diversity respected · recency penalty applied
- `state-detector.ts` · covers all 6 mapping cases
- `age-strings.ts` · correct group by class_name

**E2E flow (testing_agent)** ·
1. Login as demo student · P4A class
2. Home · tap 「同碗打招呼」
3. L1 · pick 咖喱 · goes L2
4. L2 · pick 心跳好快 + 胸口悶悶 · check bowl animations trigger
5. L3 · verify 6 candidates includes angry/furious/hollow · expand shows 12 more
6. Pick angry · customize color rose + size L
7. Talk · type 30 chars · verify rainbow ring appears
8. Regulation · choose 4-7-8 breathing · complete
9. Bridge · verify all shares default OFF · save
10. Completion · press-and-hold smile 3s · praise line appears · back to home
11. Home reveal today's bowl · check calendar shows entry with correct color/size

**Regression** · verify existing:
- Demo login/register still works
- CSV bulk upload still works
- Admin dashboards still work
- Alert / keyword detection still fires when diary text contains crisis words
- Existing calendar view still renders old entries without new fields

---

## 🚨 Migration & Backward Compatibility

**Existing entries** without new fields · frontend must:
- Treat `body_chips` as `[]`
- Treat `bowl_color_tint` as `null` (render bowl at default color)
- Treat `bowl_size` as `'M'`
- Treat `check_in_type` as `'quick_diary'`

**Existing 49-grid mode** · keep accessible via home *「直接寫日記」*  link · same as before · no migration needed for old flow.

**Feature flag** (optional but recommended)
```ts
export const FEATURE_FLAGS = {
  RITUAL_V1: true,        // Set false to rollback to old 49-grid
};
```

---

## 📦 Dependencies

**Already in project** · no new deps needed
- `react-native-reanimated` (animations)
- `expo-haptics` (feedback)
- `expo-audio` (ambient music streaming)
- `zustand` (ritual wizard state)
- `expo-image` (bowl PNG caching)

**Do NOT add** · lottie-react-native (not needed v1) · react-native-svg-charts · any new heavy libs

---

## 🎨 Wording Style Reminders (from DESIGN_PRINCIPLES.md)

- Use 中點 `·` to separate short clauses
- Use 「你 / 撳」 not 「您 / 點擊」
- Avoid exclamations for encouragement
- Age-adapted per § 4 above
- Bowl-first framing everywhere ("餵碗" not "選情緒")

---

## 🛡️ Safety Reminders

- **Keyword crisis detection** runs on `diary_text` field regardless of ritual completion state
- Alerts fire per existing school policy · never surfaced to user
- `check_in_type: hug_only` bypasses keyword scan (no text to scan)
- Regulation activities do not persist personal content (grounding inputs stay client-side)
- All shares OPT-IN, no exceptions

---

## ✅ Definition of Done (v1)

- [ ] All 8 ritual screens implemented and navigable
- [ ] `bowl-scorer.ts` returns correct 6+12 candidates for all test inputs
- [ ] Bowl animations trigger correctly on body chip selection
- [ ] Customize applies color tint + size scale live
- [ ] Typing 61+ chars produces sparkle particles on bowl
- [ ] Regulation activities include at least: 4-7-8, punch bag, grounding, box breathing, affirmation slideshow (5 minimum · rest can be v1.1)
- [ ] Bridge screen defaults all share options OFF
- [ ] Completion screen praise pool works
- [ ] Calendar shows customized bowls in album mode
- [ ] Existing features (login/CSV/admin) unaffected
- [ ] E2E testing_agent flow passes
- [ ] `test_credentials.md` updated if new demo data needed
- [ ] AGENTS.md or root README references this spec + DESIGN_PRINCIPLES.md + RITUAL_PSYCH_THEORY.md

---

## 📋 Open Items · Left for Post-Launch Iteration

- Steam decoration (5 options) — v2
- Sister app implementation — depends on user's future mascot choice
- Advanced regulation content (video slideshow via Pexels API) — v1.1
- Monthly recap animation — v2
- Class-level 「熱門 body sensation heat map」for teachers — v2
- Send-a-bowl-to-friend social feature — v2
- AI-personalized regulation content (nano banana) — v3

---

**Version** 1.0 · 2026-07-04
**Author** MoodBowl · handoff from brainstorm agent
**Next agent · your job** · Implement v1 exactly as spec above · use testing_agent after key features · finish with a working end-to-end ritual · preserve all existing features intact 🌸
