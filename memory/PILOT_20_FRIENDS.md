# Phase A · 20 位朋友試用（5 個角色）

**定義：** Phase A = 約 **20 個 acc**（學生／家長／admin／teacher／輔導都有），一次過試，之後先跟 feedback 改。  
唔估「幾多日」；用閘口慢慢打勾。

---

## 總順序（你講嘅優先）

1. **你先：** update 碗圖／美術 + 整好動畫  
2. **然後 agent／一齊：** 再 check 仲差咩技術閘口  
3. **先至：** 開 Phase A（20 acc 試）  
4. **之後：** 跟 feedback 改

---

## 角色（你會自備 ~20 acc）

唔使我哋再整「回報表／說明卡」流程（你話唔使）。  
帳由你準備：學生、家長、admin、teacher（＋如有輔導）。

| 角色 | 主要試咩 |
|------|----------|
| 學生 | 儀式、寫日記、裝飾、動畫、月曆睇返、匯出 |
| 班主任 | 老師版、負面概況 |
| 輔導 | 緊急／跟進版面 |
| 家長 | 家長版（屋企推送未開 · 試用時講清楚） |
| 校方 admin | 校政策／設定頁 |

---

## 去到 Phase A 仲差咩

### 你而家做緊（最先）

- [ ] Update 碗（圖／asset）
- [ ] 整好動畫
- [ ] 你自己 5 角色 smoke（你會做）

### 技術閘口（碗＋動畫完 → 再 check）

| 狀態 | 項目 | 邊個做 |
|------|------|--------|
| 🟡 | Live DB 跑 migrations（見下面「006／008／009」） | 你（或有 Supabase 權限嘅人）喺 Dashboard 跑 |
| 🟡 | 穩定網頁 deploy 畀 20 人（見下面「Preview：網頁」；domain 可選） | 碗／動畫後 · 開試前 |
| ✅ | 學生主路徑（寫→save→睇返→匯出） | 大致好 · 碗／動畫後再 regress |
| ✅ | notify_teacher 語意 | 碼已改 · 最好配 009 |
| 🟠 | 老師／輔導名單仍有 mock | 可帶住試 · 同朋友講明 |
| 🟠 | 屋企通知未開 | 刻意 · 講明即可 |
| ⬜ | 碗＋動畫完成後全路徑再 check | **你整完叫我** |

### Phase A 之後先做

- Live 老師／輔導跟進名單  
- 其餘 FastAPI／admin 全迁  
- Parent inbox  

---

## 006／008／009 係咩？你要做啲咩？

呢啲係 **改正式資料庫（Supabase）結構嘅 SQL 檔**，喺 repo：

- `supabase/migrations/006_soup_drink_keys.sql`
- `supabase/migrations/008_pdpo_delete_own_account.sql`
- `supabase/migrations/009_notify_teacher.sql`

App 碼已經假設／兼容呢啲改動；**如果 live DB 未跑，有機會出現「App 新、庫舊」**。

### 你要做嘅步驟（一次）

1. 開 [Supabase Dashboard](https://supabase.com/dashboard) → 你個 MoodBowl project  
2. 左邊 **SQL Editor** → New query  
3. 依次打開上面 3 個檔，**成段 copy → Run**（建議順序：006 → 008 → 009）  
4. 跑完冇紅色 error 就得  

（如果團隊用 CLI：`supabase db push` 亦可，效果一樣。）

### 各條解決咩問題

| 檔 | 人話 | 唔跑會點 | 跑咗可以處理到？ |
|----|------|----------|------------------|
| **006** | 資料庫允許 App 用嘅「飲品」名稱（草莓奶、檸水等） | 有時 **儲存日記失敗**（soup check）；而家靠程式翻譯頂住，唔穩 | **可以**減低「寫完存唔到」 |
| **008** | 用戶撳「刪除我嘅帳戶資料」時，連登入都可以清走 | 而家多數只清到日記；**登入帳可能仲喺** | **可以**令私隱刪除更完整 |
| **009** | 正式欄位叫 `notify_teacher`（想老師留意），唔再誤解成「分享俾全班」 | App 仍可靠舊欄位；語意／報表易亂 | **可以**令「想老師留意」數據乾淨 |

**結論：** 三條都建議 Phase A 前跑。最急係 **006**（關儲存穩唔穩）；**008／009** 關私隱同語意，試用亦有用。

---

## Preview：用穩定網頁做 Phase A（已定方向）

目標：20 人開 **同一條長開嘅網址**（Safari／Chrome 都得），唔再用 Expo tunnel／Cloudflare 臨時 link。

### Domain 要唔要買？

| 做法 | 適唔適合 Phase A | 要錢？ |
|------|------------------|--------|
| **先用託管免費網址**（例如 `moodbowl.vercel.app`） | ✅ 夠用 · **建議先咁做** | 託管通常免費額夠 |
| **再買自己個 domain**（例如 `moodbowl.app`） | ✅ 品牌靚、易記；可稍後綁 | Domain 約 **US$10–15／年** |
| Apple TestFlight | 唔使（呢輪用網頁） | Apple 年費另計 |

**結論：** Phase A **唔使等買到 domain 先開試**。  
想有正式品牌網址，可以而家買，之後指去同一個網站；或者試完再買都得。

### 想買 domain · 你做咩

1. **想好個名**（短、易拼、`.app`／`.com`／`.hk` 皆可）  
2. **喺邊度買（任揀一個）**  
   - [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/)（通常最平、之後 DNS 方便）  
   - [Namecheap](https://www.namecheap.com/)  
   - [Porkbun](https://porkbun.com/)  
3. **買完唔使急改 nameserver**；等網站 deploy 好先綁  
4. **隱私：** 開 WHOIS privacy（多數註冊商預設有）

### 網站託管 · 建議順序

1. 用 **Vercel / Netlify / Cloudflare Pages** 其中一個（免費 plan）  
2. 由 repo 出 **Expo web static build**（`npx expo export -p web`）再 deploy  
3. 得到一條長開網址 → 先用呢條做 Phase A  
4. （可選）Domain 買好 → 喺託管後台 **Add domain** → 跟指示改 DNS（A／CNAME）  
5. **一定要改 Supabase：** Dashboard → Authentication → URL Configuration  
   - Site URL = 你條正式網址  
   - Redirect URLs 加：`https://你的網址/**`（同免費網址 `*.vercel.app` 等）

### 開試當日流程

1. **開試前**  
   - Live DB 已跑 006 → 008 → 009  
   - 用 1 個學生帳：寫日記 → 月曆睇到 → 設定匯出得  
   - 快速確認 teacher／parent／admin／輔導入到版面  
2. **一次過發畀 20 人**  
   - 網址（固定）  
   - 每人自己嘅 acc + 密碼  
   - 一句：屋企推送未開；老師／輔導名單部分仍係示範數據；請用手機瀏覽器全螢幕  
3. **試用窗**  
   - 網址長開，唔使大家同一晚擠；仍建議約一個回報截止日  

### 唔建議

- 再用臨時 tunnel 做 20 人試  
- 20 人共用同一個 student 帳（會互相洗日記）  
- 未改 Supabase Redirect URLs 就換 domain（登入／OAuth 會斷）

---

## 閘口打勾

### A0 · 內部就緒

- [ ] 碗 update 完成  
- [ ] 動畫整好  
- [ ] Live 已跑 006、008、009  
- [ ] 你 5 角色 smoke 完成  
- [ ] 碗／動畫後叫 agent 再 check 一次  
- [ ] 穩定網頁 deploy（可用免費 `*.vercel.app`；domain 可選）  
- [ ] Supabase Site URL／Redirect URLs 已對準該網址  

### A1 · 開 20 acc 試

- [ ] 發固定網址 + 各人 acc  
- [ ] 講明已知限制  
- [ ] 收 feedback  

### A2 · 跟 feedback 改

- [ ] 崩壞／私隱／儲存問題優先  
- [ ] 再排下一輪功能  
