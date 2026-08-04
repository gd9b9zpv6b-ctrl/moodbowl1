# MoodBowl Design System · 統一設計原則

> **目的**：呢份文件係 MoodBowl 嘅視覺同 UX 「單一真相」。當我哋建立姐妹 App 嗰陣，另一個 agent 必須跟晒呢度嘅所有規範。
> **黃金原則** · **溫柔（gentle）＞ 冷酷精準**。每一個 pixel、字、動作，都要令用戶感覺被溫柔對待。

---

## 0 · 品牌 DNA（Brand DNA）

| 面向 | 定義 |
|---|---|
| **語調（Voice）** | 好朋友嘅語氣 · 唔係 clinical · 唔係打氣 slogan · 唔用感嘆號叫人「加油」。用「你」而唔用「您」。允許不完美（「唔緊要 · 慢慢嚟」）。 |
| **意象（Metaphor）** | 一碗溫暖嘅飯（🍚 rice bowl mascot）· 房間有暖光 · 手寫日記本 · 花園慢慢生長。 |
| **情緒（Feel）** | 手作感（handcrafted） · 唞氣（breathable） · 靜（quiet） · 唔完美但溫暖（imperfect · warm）。 |
| **禁忌（Anti-patterns）** | ❌ 生硬繁體「請點擊」（要用「撳」）❌ 硬 shadow / neon glow ❌ 全大階段標題 ❌ 紅色 danger 感嘆號 ❌ animated GIF loading spinner |

---

## 1 · 色彩系統（Color System）

### 1.1 · 主色板（Primary Palette · `/app/frontend/src/constants/theme.ts` — 唔可以隨便改）

```ts
export const COLORS = {
  // 背景 — 米白為底 · 柔和唔刺眼
  bgMain:        '#F9F8F6',   // App 背景 · 溫暖米白
  bgCard:        '#FFFFFF',   // 卡片 · 純白（唯一位可以「亮」）
  bgInput:       '#F0EFEB',   // Input / Chip 灰底 · 比 bgMain 深少少

  // 品牌色 — 薄荷 sage 綠 · healing 感
  primary:       '#A3C4BC',   // 主按鈕 · Active 狀態
  primaryLight:  '#D1E2DE',   // 主色 tint 底 · Badge / Chip 底
  secondary:     '#B8C0FF',   // 藍紫 · 用於次要重點 · 唔常用
  accent:        '#F4D0C9',   // 淡珊瑚粉 · Highlight · 溫暖點綴

  // 文字階層 — 深灰藍 · 唔用純黑
  textPrimary:   '#2D3142',   // 標題 / 主要內容
  textSecondary: '#7D8297',   // 副文 · Hint
  textDisabled:  '#B0B3C1',   // 禁用 · Placeholder
  textInverse:   '#FFFFFF',   // 深色底上嘅字

  // Border · 幾乎透明 · 只喺需要嗰陣先出現
  borderLight:   'rgba(45, 49, 66, 0.05)',
  borderFocus:   '#A3C4BC',

  // Danger — 唯一警告色 · 用得極少 · 從唔閃 · 從唔震
  danger:        '#F08080',
};
```

### 1.2 · 情緒色（Emotion Tints · 唔硬啲 saturation）

每個情緒 category 對應一個柔和色（**Pastel、飽和度低、明度高**）：

| Category | Hex | 用途 |
|---|---|---|
| 溫暖 warm | `#D6E5D8` | Happy / Content / Loved |
| 傷心 sad | `#BDE0FE` | Sad / Lonely / Empty |
| 緊張 nervous | `#FFD6A5` | Anxious / Worried |
| 自我懷疑 wound | `#D5AAFF` | Insecure / Worthless |
| 憤怒 anger | `#FFAAA5` | Angry / Frustrated |
| 講唔出 unspoken | `#E8D5F0` | 未歸類 · 樹洞 |

**規則**：呢啲色 **永遠冚 25% opacity tint 底** 或者做 chip / badge，唔好用做 full-screen 底。

### 1.3 · Diary 紙張色（Paper Tints · 手寫本感）

```
cream #FBF6E9 · mint #EAF2E6 · sky #E9F0F8 · rose #FBEBEB · sand #F3E9D8 · night #2E2F3E
```
配線色（`line`）永遠比 `bg` 深 20% · 模擬紙上淡淡橫線。

### 1.4 · 語義色（Semantic Colors · 用於 Alert / Status Bar）

| 意義 | Tint 底 | 主色（accent line / icon） |
|---|---|---|
| **成功 / 正向** | `#EAF2EE` | `#7BA88C` / `#4E7962` |
| **提醒 / 資訊** | `#EEF5F1` | `#7BA88C` |
| **警告 / 注意** | `#FEF9E7` | `#B57D2A` / `#8A5F1F` |
| **危險 / 錯誤** | `#FDECEC` | `#8A3F3F` |
| **中性 hint** | `#F0EBE0` | `#5F4A2E` |

**Never** 用純紅 `#FF0000` · Danger 永遠用暗玫瑰紅 `#F08080` 或深紅字 `#8A3F3F`。

### 1.5 · 角色色（Role Chips · 只用於 B2B dashboards）

```
student      #B9DBBC  (soft sage)
teacher      #F0AE64  (warm amber)
counsellor   #7DBEE8  (mint sky)
parent       #E499B4  (rose)
school_admin #C7A6D1  (dusk purple)
```

---

## 2 · 排版（Typography）

### 2.1 · Font Stack

- **UI（default）**：System · 中英文都靠 iOS/Android 系統字（PingFang HK / Noto Sans TC / SF Pro / Roboto）
- **Diary 內容**（Premium）：手寫體 · 例如 `LXGWWenKai 霞鶩文楷` / `HunInn 奶油粉圓體` / `MaShanZheng 毛筆手寫` — 只喺日記詳情頁用，其他地方一律 System。

### 2.2 · Type Scale（絕對規範）

| 用途 | Size | Weight | Line-height |
|---|---|---|---|
| **Display**（Welcome / Onboarding title） | 40 | 700 | 1.15 |
| **H1** 頁面主標題 | 26 | 800 | 1.25 |
| **H2** Section 標題 | 20 | 800 | 1.3 |
| **H3** Card 標題 | 18 | 700 | 1.35 |
| **Title** 常用標題 | 15 | 700 | 1.4 |
| **Body** 正文 | 15 | 400 | 1.6 |
| **Body-emphasis** 副文 | 13 | 400 | 1.55 |
| **Caption** 提示 | 12 | 400 / 700 | 1.5 |
| **Micro** 極細標籤 | 11 | 600 / 700 | 1.4 |

### 2.3 · Weight

- **400** 一般內容
- **600** 副標題 / Chip
- **700** 標題 / Button label / 強調
- **800** 大標題 / Hero title · 用得節制

### 2.4 · Text Color 對照

```
標題         COLORS.textPrimary   #2D3142
副文 / hint  COLORS.textSecondary #7D8297
禁用 / 提示  COLORS.textDisabled  #B0B3C1
深色底文字   COLORS.textInverse   #FFFFFF
```

---

## 3 · 間距 · 圓角 · 陰影（Spacing · Radius · Shadow）

### 3.1 · 4pt Grid（8pt 為主）

```ts
SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
```

**規則**：
- 卡片內 padding：`SPACING.md`（16）
- Section 之間：`SPACING.lg`（24）
- Screen padding：`SPACING.lg`（24）水平 · 頂 `SPACING.md`（16）
- 兩個 Element 之間最少 `SPACING.sm`（8）· 唔好貼死

### 3.2 · Radius（大圓潤 · 溫柔感關鍵）

```ts
RADIUS = { sm: 8, md: 16, lg: 24, pill: 9999 };
```

**規則**：
- Input / Chip：`sm`（8）
- Card / Section：`md`（16）
- Modal / Hero card：`lg`（24）
- Button / Badge：`pill`（9999）— **主 CTA 永遠 pill shape**

### 3.3 · Shadow（極輕 · 幾乎察覺唔到）

**Elevated card**（例如 Logo badge / Modal）：
```ts
shadowColor:   '#000',
shadowOpacity: 0.06,
shadowRadius:  20,
shadowOffset:  { width: 0, height: 8 },
elevation:     3,   // Android
```

**Tab bar / Bottom bar**（陰影向上）：
```ts
shadowOpacity: 0.05,
shadowRadius:  12,
shadowOffset:  { width: 0, height: -4 },
```

⚠️ **一般卡片唔加 shadow** · 用 `bgCard: #FFFFFF` 對比 `bgMain: #F9F8F6` 天然分層就夠。

---

## 4 · Components 樣式規範

### 4.1 · Primary Button（主要行動）

```ts
{
  backgroundColor: COLORS.primary,     // #A3C4BC
  height: 56,
  borderRadius: RADIUS.pill,
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',                // 支援 icon + text
  gap: SPACING.sm,
}
// Text
{ color: COLORS.textPrimary, fontSize: 17, fontWeight: '700' }
```

- **Disabled**：`opacity: 0.6`（唔轉色）
- **Loading**：換做 `<ActivityIndicator color={COLORS.textPrimary} />`
- **有 icon**：Feather 18px + 6-8px gap

### 4.2 · Secondary Button（次要 · Ghost）

```ts
{
  height: 56,
  borderRadius: RADIUS.pill,
  backgroundColor: 'transparent',      // 冇底
  alignItems: 'center',
  justifyContent: 'center',
}
// Text
{ color: COLORS.textPrimary, fontSize: 15, fontWeight: '500' }
```

### 4.3 · Link Text（inline 連結）

- 字：`fontSize: 13, color: COLORS.textSecondary`
- 加重點：內嵌 `<Text style={{fontWeight: '700'}}>` 局部粗
- **絕對唔用純藍色 underline**（web 感）

### 4.4 · Card（內容區塊）

**標準卡（列表項）**
```ts
{
  backgroundColor: COLORS.bgCard,
  borderRadius: RADIUS.md,
  padding: SPACING.md,
  marginBottom: SPACING.sm,
  flexDirection: 'row',                // 通常左 icon + 中內容 + 右 chevron
  alignItems: 'center',
  gap: SPACING.md,
}
```

**Hero card**（重點展示 · 彩色底）
```ts
{
  backgroundColor: <tint color>,       // 例如 #FFE4E4
  borderRadius: RADIUS.lg,             // 24 · 大圓
  padding: SPACING.lg,
  alignItems: 'center',                // 內容居中
  marginBottom: SPACING.lg,
}
```

**Grid Card**（Admin dashboard 8-cell）
```ts
{
  width: '48%',                        // 兩列
  aspectRatio: 1.05,                   // 略高於方
  backgroundColor: <card.bg tint>,
  borderRadius: RADIUS.md,
  padding: SPACING.md,
  // 內：頂左 icon circle + 底左 title + subtitle
}
```

### 4.5 · Input（文字輸入）

```ts
{
  borderWidth: 1,
  borderColor: COLORS.bgInput,        // 幾乎無 border · 只有輕輕輪廓
  borderRadius: RADIUS.sm,
  paddingHorizontal: 12,
  paddingVertical: 12,
  fontSize: 15,
  color: COLORS.textPrimary,
  backgroundColor: COLORS.bgCard,
}
```

- **Placeholder**：`placeholderTextColor={COLORS.textDisabled}`
- **Label** 喺上面：`fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4`
- **Focus** 狀態：`borderColor: COLORS.borderFocus`（sage 綠）
- **Password field** ALWAYS `secureTextEntry` · 唔加眼睛 toggle（減少 clutter）
- **OTP field**：`fontFamily: 'monospace', letterSpacing: 8, textAlign: 'center', fontSize: 22`

### 4.6 · Chip / Pill（狀態標籤）

```ts
{
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: RADIUS.pill,
  backgroundColor: <tint>,             // 例如 primaryLight
}
// Text
{ fontSize: 11-12, fontWeight: '700', color: <accent> }
```

### 4.7 · Alert Box（訊息提示 · 4 種語義色）

**Info / 成功**
```ts
{
  flexDirection: 'row', alignItems: 'center', gap: 6,
  backgroundColor: '#EAF2EE',
  borderRadius: RADIUS.sm,
  padding: SPACING.sm,
  borderLeftWidth: 3,
  borderLeftColor: '#4E7962',
}
// Icon: Feather mail/check-circle · 12-14px · color #4E7962
// Text: fontSize 12, color '#3F5A4D'
```

**Warning**
```ts
backgroundColor: '#FEF9E7',
borderLeftColor: '#B57D2A',
// Text: color '#8A5F1F'
```

**Danger**
```ts
backgroundColor: '#FDECEC',
borderLeftColor: '#8A3F3F',
// Text: color '#8A3F3F'
```

**Hint（中性）**
```ts
backgroundColor: '#EEF5F1',
borderLeftColor: '#7BA88C',
// Text: color '#3F5A4D'
```

**規則**：所有 Alert Box **必有** 左邊 3px accent line + 內部 icon（Feather `alert-circle` / `info` / `check-circle` / `mail`）· 唔好用純底色。

### 4.8 · Section Title（列表分組標題）

```ts
{
  fontSize: 13,
  fontWeight: '700',
  color: COLORS.textSecondary,
  letterSpacing: 0.6,
  marginTop: SPACING.md,
  marginBottom: SPACING.sm,
  textTransform: 'none',              // 唔全大階段
}
```

### 4.9 · Modal / Bottom Sheet

- Overlay：`rgba(0,0,0,0.4)`（唔用純黑）
- 表面：`backgroundColor: COLORS.bgCard, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg`
- 頂部有 24×4 灰色 handle bar 表示可拉動
- Padding：`SPACING.lg`（24）

### 4.10 · Tab Bar

```ts
{
  backgroundColor: COLORS.bgCard,
  borderTopWidth: 0,                   // 唔用 border · 用 shadow 分層
  height: 60 + insets.bottom,
  paddingBottom: insets.bottom + 6,
  paddingTop: 8,
  shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12,
  shadowOffset: { width: 0, height: -4 },
}
tabBarActiveTintColor:   COLORS.primary
tabBarInactiveTintColor: COLORS.textDisabled
tabBarLabelStyle:        { fontSize: 11, fontWeight: '600' }
```

**Icons**：全用 `@expo/vector-icons` Feather · size 22-24（自動繼承 tab 傳入嘅 size）

---

## 5 · Iconography

### 5.1 · 只用 3 種圖形語言

| 類型 | 用途 |
|---|---|
| **Feather Icons** | 所有 UI 圖示（Button icon · Tab icon · Chevron · List icon） · Stroke 1.5 · 圓潤末端 |
| **Emoji** | 情緒 · 品牌 · 溫度感嘅裝飾（🍚 🌱 💚 🌿 ✨） · 唔用做 CTA |
| **PNG Mascot** | 「飯碗」emotion icons（`/assets/emotions/*.png`） · 自訂繪製 · 唯一嘅原創插畫 |

⚠️ **絕對禁忌**：Material Icons / FontAwesome / ionicons / Lucide — 保持 stroke 風格一致。

### 5.2 · Icon 尺寸

```
極細（inline）      12-14
表單 label          14-16
列表 icon           18
Button icon         18
Tab bar icon        22-24
Header back btn     22
Section hero icon   32
Empty state icon    64-96
```

### 5.3 · Icon 容器（Circle wrapper）

```ts
{
  width: 40, height: 40, borderRadius: RADIUS.pill,
  backgroundColor: <soft tint>,        // 例如 primaryLight
  alignItems: 'center', justifyContent: 'center',
}
// 內裝 Feather 18px · color = 相配嘅深色版
```

---

## 6 · Layout Patterns

### 6.1 · Screen Skeleton（每個頁面基本結構）

```tsx
<SafeAreaView style={{flex:1, backgroundColor: COLORS.bgMain}} edges={['top','bottom']}>
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1}}>
    <ScrollView
      contentContainerStyle={{padding: SPACING.lg, paddingBottom: SPACING.xxl}}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Back button (chevron-left / arrow-left, 22px) — always top-left */}
      {/* Title — H1 · 26/800 */}
      {/* Subtitle — 13/400 secondary */}
      {/* Content sections */}
    </ScrollView>
  </KeyboardAvoidingView>
</SafeAreaView>
```

### 6.2 · Header 樣式

**極簡 header**（返回 + 標題居中）
```
[← BackBtn 40x40 pill bgCard]   [Title H3 700 center]   [40 placeholder]
```

**Tab header**（首頁類）
- 冇 header · 直接 `paddingTop: SPACING.md` + 頁面 hero

### 6.3 · Vertical Rhythm

由上到下順序：
1. Header / Back（`SPACING.md`）
2. Hero / Title（`marginBottom: SPACING.lg`）
3. Sections（每個之間 `SPACING.lg`）
4. Primary CTA（`marginTop: SPACING.lg`）
5. Footer text hint（`marginTop: SPACING.lg`, textAlign center）

### 6.4 · Empty State

```tsx
<View style={{alignItems:'center', padding: SPACING.xl}}>
  <Feather name="inbox" size={64} color={COLORS.textDisabled} />
  <Text style={{fontSize: 15, color: COLORS.textSecondary, marginTop: SPACING.md, textAlign: 'center'}}>
    暫時冇任何 [entity] · [鼓勵性提示]
  </Text>
</View>
```

⚠️ **每個 empty state 一定要用鼓勵性語氣**（唔係「No data」 · 而係「你嘅心情曆等緊你嘅第一頁 🌱」）

---

## 7 · Motion / Animation

### 7.1 · 基本原則

- **時長**：200-300ms · 唔可以超過 400ms
- **Easing**：`Easing.out(Easing.quad)` 一律 · 進入柔和 · 退出快
- **絕對唔用 spring bounce** — 太活潑，破壞冥想感

### 7.2 · 常用 pattern

- **頁面切換**：Expo Router 預設 slide · 唔改
- **Modal**：`presentationStyle="pageSheet"` iOS · 底彈
- **列表加入**：透明度 fade in（`opacity: 0 → 1`）
- **按下反饋**：Pressable `pressed && {opacity: 0.85}` · 唔用 scale
- **Loading**：`<ActivityIndicator color={COLORS.primary} />` · 唔用 skeleton screen

---

## 8 · 語言 · 文案（Cantonese Traditional Chinese）

### 8.1 · 用字規範

| ❌ 唔用 | ✅ 用 |
|---|---|
| 您 / 請 | 你 |
| 點擊 / 點選 | 撳 |
| 確定 / 確認 | 好 / 好啦 |
| 取消 | 唔要 / 返去 |
| 刪除 | 唔要呢個 / 移走 |
| 提交 / 送出 | 交出 / 寫低 |
| 加載中 | 準備緊 · 諗緊 |
| 錯誤 · 失敗 | 唔啱 · 出咗少少問題 |
| 網絡錯誤 | 連唔到 · 過陣再試 |
| 恭喜 | 好嘢 · 好叻 |
| 立即 · 現在 | 而家 · 依家 |
| 分享 | 派 / 派俾人睇 |
| 完成 | 搞掂 |

### 8.2 · 標點符號

- 用 **中點 `·`** 代替逗號分隔平行短句：「深呼吸 · 慢慢嚟 · 你已經好努力」
- 一句最多一個問號 · 唔用 `??` 或 `!!`
- 表情符號一句最多一個 · 放句尾：「歡迎返嚟 🌱」

### 8.3 · 語氣模板

- **打招呼**：「歡迎返嚟」/「你返嚟啦」/「傾偈嗎」
- **鼓勵**：「你已經好努力」/「多謝你今日撐住咗」/「一小步都係前進」
- **錯誤**：「出咗少少問題 · 過陣再試」/「連唔到 backend · 唞下再嚟」
- **確認**：「好啦」/「明白」/「知道」
- **等待**：「準備緊 · 唔洗急」

### 8.4 · Empty state / 首頁招呼

Random 抽取 `AFFIRMATIONS` array 中一句（見 `/app/frontend/src/constants/affirmations.ts`）· 每次入頁面隨機一句。**唔可以直接顯示 static 文字**。

---

## 9 · 情緒 · 心情機制（獨有）

### 9.1 · Bowl Mascot Emotions（39 款）

- 每一個情緒都對應一個 **手繪飯碗表情 PNG**（rice bowl mascot）
- 由 Gemini Nano Banana AI 生成，統一手繪風格
- 儲存喺 `/app/frontend/assets/emotions/*.png`
- 顯示用 `<EmotionVisual emotion={obj} size={48} radius={RADIUS.md} />`

### 9.2 · Energy Slider（能量條）

低能量 ← → 高能量 · 5 個 level · 每個 level 有專屬顏色 tint（見 `/app/frontend/src/constants/energy.ts`）

### 9.3 · 主頁三大 layer（唔可以打亂順序）

```
┌────────────────────────────┐
│  Affirmation（隨機一句）    │  ← 用戶開機第一眼睇到
├────────────────────────────┤
│  今日情緒選擇（bowl grid）   │  ← 6 category tab + PNG grid
├────────────────────────────┤
│  能量條 · 想寫嘅嘢          │  ← 選咗情緒之後展開
└────────────────────────────┘
```

---

## 10 · Component Naming Convention

### 10.1 · TestID pattern

所有 interactive element 一定有 `testID`。命名格式：

```
<screen>-<component>-<action>
```

例子：
- `login-submit-btn`
- `login-email-input`
- `forgot-otp`
- `demo-login-<email>`
- `admin-nav-<card-key>`
- `resend-invite-<email>`

### 10.2 · Style key 語意化

- `primaryBtn` / `primaryBtnText` — 主按鈕
- `secondaryBtn` / `secondaryBtnText` — 次按鈕
- `card` / `cardHead` / `cardBody` — 卡片
- `errorBox` / `errorText` — 錯誤訊息
- `infoBox` / `infoText` — 資訊訊息
- `linkRow` / `linkIcon` / `linkTitle` / `linkHint` — 列表 row

---

## 11 · Accessibility 底線

- 主按鈕 hit area 最少 **44×44 pt**（iOS）/ **48×48 dp**（Android） · 用 `height: 56` 就夠有餘
- 所有 icon-only button ALWAYS 有 `accessibilityLabel`
- 文字對比度 ≥ 4.5:1（`textPrimary #2D3142` on `bgMain #F9F8F6` = 12.4:1 ✅）
- 唔用純色差傳達 status · 一律 icon + 顏色 + 文字三重
- Dynamic Type respect · 唔硬 fix pixel size 喺 body 文字

---

## 12 · Do / Don't 極速表

### ✅ DO

- 每個頁面 SafeAreaView + KeyboardAvoidingView
- Pill button（`RADIUS.pill`）作為 primary CTA
- Alert box 4-色系統（info / warning / danger / hint）+ 左邊 3px accent line
- 大 padding · 少擠迫（`SPACING.lg` for screen · `SPACING.md` for card）
- 中點 `·` 分隔短句
- 系統字 · 手寫字只留俾 diary detail
- Feather + Emoji + 飯碗 PNG（3 種 icon 語言，唔混雜）
- 每個 empty state 有鼓勵性 copy
- 所有 interactive element 有 `testID`

### ❌ DON'T

- 用感嘆號叫人「加油！」
- 用純紅色警告 `#FF0000`
- 硬 drop shadow / neon glow
- 全大階段（英文都用 Title Case · 唔用 UPPERCASE）
- 加載 spinner 用 GIF · 一律 `ActivityIndicator`
- 用 Material Icons / FontAwesome / Lucide
- 「請點擊確定按鈕」呢種硬繁體
- Border 用喺卡片外框（用 bgCard 對比 bgMain 分層）
- Modal 用純黑 overlay（用 `rgba(0,0,0,0.4)`）
- 用 `!important` 級數嘅 style override

---

## 13 · 檔案 · 目錄結構規範（Sister App 對應）

```
/app/frontend/src/
  constants/
    theme.ts                ← 呢份 doc 中「COLORS/RADIUS/SPACING」嘅 source of truth
    emotions.ts             ← 情緒定義（sister app 可以覆蓋）
    affirmations.ts         ← 首頁溫柔句
    diary-style.ts          ← Diary 紙張同字體
  components/               ← 共用 UI atom / molecule
    emotion-visual.tsx      ← 飯碗 mascot 渲染
    energy-slider.tsx       ← 5-level 能量條
    entry-detail-modal.tsx  ← 日記詳情 modal
    ...
  lib/
    api.ts                  ← axios wrapper · 401 handling
    auth-context.tsx        ← Auth + role storage
    role-storage.ts         ← 角色 meta（label / emoji / color / homePath）
/app/frontend/app/          ← Expo Router 頁面
  auth/                     ← welcome / login / register / activate / forgot-password
  (tabs)/                   ← index / calendar / community / tasks / profile
  premium/                  ← index / pin / diary-style / icon-packs
  onboarding.tsx
  privacy.tsx
  help.tsx
```

**核心規則**：**唔可以** 復用 `/app` 目錄放非路由 code · 全部組件放 `/src`。

---

## 14 · 品牌 mascot 統一

- **主 mascot**：🍚 rice bowl · 用喺 empty state · 品牌頭像 · Email 頂 logo
- **輔助植物 icons**：🌱 🌿（用喺 healing 語境）
- **心 icon**：Feather `heart` size 32-40 · color `#E86A6A`（用喺 hero card）· **唔用 emoji ❤️**（太 loud）

---

## 15 · Sister App 應該保留 vs 可以變

### 一定要一模一樣（Non-negotiable）

- 全部 `COLORS`, `SPACING`, `RADIUS` 值
- Typography scale + weight
- Alert box 4 種語義色格式
- Pill CTA + 56px height
- Feather + Emoji + PNG mascot 3 語言
- 中點 `·` + 廣東話 wording style
- Tab bar layout
- SafeAreaView + KeyboardAvoidingView + ScrollView 三件套

### 可以按 sister app 主題調整

- Emotion mascot PNG（sister app 可以係另一種動物 / 物件，但要用 **同一種手繪風格** · 建議都用 Gemini Nano Banana 生成統一風格）
- `EMOTION_CATEGORIES` 標籤（例如 sister app 係關於「壓力」主題 · 可以改成 study/work/family 分類，但顏色 tint 系統唔變）
- Affirmation 詞句（保留語氣 · 換內容）
- Icon pack 主題名（保留 `classic / sea / forest / sky` 命名格式）
- Hero background image（保留 blur + gradient overlay pattern）

### 絕對禁止改（Break the family look）

- 加 border 落卡片
- 用純紅 danger
- 出現任何 Material Design 樣式
- Font weight 用 900 / 300（只 400 · 600 · 700 · 800）
- Emoji 大量鋪張（每屏最多 3-4 個）
- 加深色模式而唔用 diary-style 嘅 `night` paper tint 邏輯

---

## 16 · Sister App Onboarding Checklist

Sister app 開發時 · agent 必須：

- [ ] 複製 `/app/frontend/src/constants/theme.ts` 完整
- [ ] 遵守 8pt SPACING grid
- [ ] Primary CTA 一定用 pill · height 56 · `COLORS.primary` 底
- [ ] 用返 Feather + Emoji + 手繪 PNG 3 種 icon 系統
- [ ] Alert 用 4 語義色 + 左 3px accent line
- [ ] Wording 用中點 `·` 分隔 · 用「你 / 撳」而唔用「您 / 點擊」
- [ ] 每個 interactive element 有 `testID`
- [ ] Tab bar 樣式一致
- [ ] Empty state 有鼓勵性 copy
- [ ] 頁面骨架用 SafeAreaView + KeyboardAvoidingView + ScrollView

---

## 17 · 參考檔案（Sister App agent 必讀）

| 目的 | 檔案 |
|---|---|
| Color / Spacing / Radius | `/app/frontend/src/constants/theme.ts` |
| Emotion 定義 | `/app/frontend/src/constants/emotions.ts` |
| 首頁 affirmation | `/app/frontend/src/constants/affirmations.ts` |
| Diary 紙張 · 字體 | `/app/frontend/src/constants/diary-style.ts` |
| Welcome 頁 骨架 | `/app/frontend/app/auth/welcome.tsx` |
| Login 頁 骨架 | `/app/frontend/app/auth/login.tsx` |
| Forgot Password 2-step pattern | `/app/frontend/app/auth/forgot-password.tsx` |
| Onboarding 樣式 | `/app/frontend/app/onboarding.tsx` |
| Tab bar 骨架 | `/app/frontend/app/(tabs)/_layout.tsx` |
| 首頁 layer 結構 | `/app/frontend/app/(tabs)/index.tsx` |
| Premium (card + link row) | `/app/frontend/app/premium/index.tsx` |
| Admin grid card | `/app/frontend/app/school-admin.tsx` |
| Alert Box variants | `/app/frontend/app/auth/forgot-password.tsx`（`ErrorLine` / `InfoLine`）|

---

**Version** 1.0 · 2026-07-04
**Author** MoodBowl main design system
**Sister app 開發者** · 讀完呢份 doc 之後，如果有任何情況冇覆蓋，**永遠選擇更溫柔嗰個做法**。
