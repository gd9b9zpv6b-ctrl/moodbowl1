# Phase A 前 · 免費檢查（唔使畀錢 AI）

你可以用 **Cursor 免費額／本機指令** 先跑，確認技術冇大問題，先開 Phase A 真朋友。

## 而家已經免費跑過嘅結果（agent）

| 檢查 | 結果 |
|------|------|
| 前端單元測試 `yarn test` | ✅ **58+** 全過（含老師跟進規則） |
| Demo 6 個角色登入 live Supabase | ✅ 全部 OK（`demo1234`） |
| 學生寫／刪日記 | ✅ OK |
| Live 缺 migration **006** soup keys | ❌ 未跑（`strawberry_milk` 會存唔到） |
| Live 缺 migration **007** `bowl_release` | ❌ 未跑 |
| Live 缺 migration **009** `notify_teacher` | ❌ 未跑 |
| Live 缺 migration **010** `school_id` 等 | ❌ 未跑 |

**結論：** 登入同基本寫日記得；**未跑齊 migration 就請朋友會有機會撞「想老師留意／碗釋放／多校欄」問題。**  
→ 你喺 Supabase 跑完 006→010，再跑一次 smoke，全 PASS 先開 Phase A。

## 你自己 1 分鐘重跑（免費）

```bash
cd frontend
yarn test
yarn smoke:phase-a
```

SQL 核對（Dashboard → SQL Editor）：

- 貼上 `supabase/phase_a_preflight.sql` → Run  
- 缺嘅就按 `memory/PILOT_20_FRIENDS.md` 跑 migration

## 「免費 AI」係指咩？

| 做法 | 費用 | 做到咩 |
|------|------|--------|
| **Cursor agent／你叫我再跑** | 跟你 Cursor plan | 跑測試、讀 log、改碼 |
| **`yarn test` + `yarn smoke:phase-a`** | 完全免費 | 邏輯＋ live demo 登入／寫日記 |
| **Supabase SQL preflight** | 免費 | 睇 migration 齊未 |
| ChatGPT／其他付費「虛擬用家」 | 可能要錢 | **代替唔到** 真手機 Safari 體驗 |

冇需要另外買「AI 測試服務」先開 Phase A；用上面三樣就夠做技術閘。

## 全 PASS 之後先做

1. 你自己 5 角色 smoke（瀏覽器）  
2. 碗／動畫你滿意  
3. 先至請 Phase A 朋友  
