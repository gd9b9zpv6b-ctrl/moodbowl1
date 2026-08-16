# 多校資料隔離 · 大規模預備

**產品目標：** 廣東話小學大規模使用；賣套 App 俾多間學校時，**一間學校一套 data**，校與校之間唔可以亂睇。

**而家結論：** 單校 Phase A／朋友試用 **夠用**；**未夠**「正式賣俾幾間學校」嘅嚴格隔離。  
趁而家 data 少，先打底，遲啲先唔使大遷移。

---

## 而家岩唔岩？

| 層 | 狀態 | 人話 |
|----|------|------|
| `schools` + `school_memberships` | ✅ 已有 | 可以標記「邊個屬邊間校」 |
| Community 日記 RLS（`same_school`） | 🟡 半成品 | 兩邊都有 membership 先隔得到；日記本身未強制 stamp `school_id`（010 補） |
| Alerts `school_id` | 🟡 | 有欄；crisis 用「第一個 membership」，多校會歧義 |
| `profiles.school_id` | 🟠 | 欄位有，demo／註冊多數空白 |
| 老師／輔導／admin 多數畫面 | ❌ | 仍靠舊 FastAPI／Mongo **成個 DB 共用**，無 school filter |
| 班別 | ❌ | Mongo 用字串 `class_name`（如 `6A`），兩間校都叫 6A 會撞 |
| 校政策（社區／關鍵字） | ❌ | 前端 AsyncStorage 本機 mock，唔係「一校一 set」 |
| 家長連結 `family_links` | ❌ | SPEC 有，庫未齊（010 建 stub） |
| 邀請碼／開校流程 | ❌ | 未按校隔離 |

**一句：** 而家係 **單校 MVP + 一啲 tenancy 腳手架**。第二間校一入同一 DB，admin／alerts／班別就容易亂。

---

## 正確產品模型（目標）

```
School A                    School B
├─ students / teachers      ├─ students / teachers
├─ classes                  ├─ classes
├─ diaries (school_id=A)    ├─ diaries (school_id=B)
├─ alerts / policies        ├─ alerts / policies
└─ invites / families       └─ invites / families
```

規則：

1. **每個學校用戶有且只有一個 primary school**（小學場景；跨校職員之後再特例）
2. **所有校內業務資料都帶 `school_id`**（日記、alerts、邀請、政策、班）
3. **RLS／API 一律用「我嘅學校」過濾**；唔好信前端自己 `.eq('school_id')` 做唯一防線
4. **開新校 = 新 `schools` row + 開 admin + 發邀請**；唔好複製 demo 帳亂用

---

## 趁 data 少 · 而家做（010 migration）

已落庫／碼：

- [x] `current_school_id()` / `primary_school_id_for(uid)`
- [x] `school_memberships.is_primary` + 一人一個 primary
- [x] `diaries.school_id` + 寫入自動 stamp + 舊資料 backfill
- [x] sync `profiles.school_id` ← primary membership
- [x] `school_policies` / `family_links` / `invite_codes` stub（一校一 set 結構）
- [x] crisis alert 優先用 diary／primary school
- [x] 兩校隔離驗證 SQL：`supabase/seed_two_schools_isolation.sql`

**你要做：** 喺 Supabase SQL Editor 跑完既有 006→009 後，再跑 **010**（同可選兩校 seed 驗證）。

---

## Phase A（20 朋友）點樣唔亂

Phase A **可以繼續單校**：

- 用現有 Demo School（或你開一間「試用校」）
- 20 個 acc **全部 membership 同一間**
- **唔好**同時開第二間正式校入同一個試用環境亂加真學生

網頁方向同 domain 見 `PILOT_20_FRIENDS.md`。

---

## 之後先做（賣校前必做）

1. **開校／邀請 Edge Function**：只允許 service role 寫 membership／role  
2. **所有 staff API** 帶 `school_id`（或廢 Mongo global admin，全面走 Supabase RLS）  
3. **班別** 用 `classes` + `class_memberships`，廢跨校 `class_name` 字串匹配  
4. **校政策** 讀寫 `school_policies`，唔再 AsyncStorage  
5. **自動化測試：** 兩校帳號互相讀日記／alerts 必須 fail（SPEC §8／§9）  
6. **Audit log**（輔導／admin 睇危機）

---

## 絕對唔好做

- 多間校共用同一批 demo 帳  
- 假設「老師睇 class_name=6A」天然安全  
- 未改 Redirect／RLS 就將第二間校 data 倒入 live  
- 用客戶端改 `profiles.role`／`school_id` 做授權  

---

## 建議時間線（技術閘口，唔估日數）

| 閘口 | 內容 |
|------|------|
| **而家** | 跑 010；Phase A 維持一間試用校 |
| **碗／動畫完 + Phase A feedback** | 再 check 隔離；開始開校／邀請 RPC |
| **第一間付錢學校上線前** | staff API 全面校內過濾 + 兩校自動測試綠燈 |
| **第 N 間校** | 只靠開校流程加校，唔改 schema |

有疑問優先睇呢份 + `SPEC.md` §5／§7 tenancy。
