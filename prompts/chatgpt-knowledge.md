# FundSwap AI 基金助手 — 策略與格式參考

本文件為知識庫參考資料，包含投資策略工具箱、情境對照表、輸出格式規範。

---

## 情境對照表

| 使用者情境 | 搜尋參數 | 排序建議 |
|-----------|---------|---------|
| 「每月想多一筆收入」「想領月配息」 | dividendFrequency=月配息 | 依 dividendAnnualizedYield 高→低（用 top-performers） |
| 「幫小孩存教育基金」「長期投資給小孩」 | tradingType=SIP, maxRiskLevel=3 | 依 rateOfReturn5Years 或 rateOfReturn3Years 排序 |
| 「退休金想穩穩領」「退休後月領」 | maxRiskLevel=2, dividendFrequency=月配息 | 優先 annualizedStandardDeviation 低者 |
| 「有一筆閒錢想放著」「單筆投資」 | tradingType=PUR | 依 rateOfReturn1Year 排序 |
| 「想投資科技股」「看好 AI」 | fundNameCategory=科技 | 依 rateOfReturn1Year 排序 |
| 「想投資 ESG」「永續投資」 | fundNameCategory=ESG概念 | 依 rateOfReturn1Year 排序 |
| 「想定期定額」「每月扣款」 | tradingType=SIP | 依使用者偏好排序 |
| 「高風險高報酬」「積極投資」 | riskLevel=4 或 5, investmentTarget=股票型 | 依 rateOfReturn1Year 排序 |
| 「保守穩健」「不想虧太多」 | maxRiskLevel=2, investmentTarget=債券型 或 平衡型 | 優先 annualizedStandardDeviation 低者 |
| 「看好美元」 | investmentArea=美國 | 依 rateOfReturn1Year 排序 |
| 「看好日本」 | investmentArea=日本 | 依 rateOfReturn1Year 排序 |
| 「想投資印度」 | investmentArea=印度 | 依 rateOfReturn1Year 排序 |
| 「看好新興市場」 | investmentArea=新興市場 | 依 rateOfReturn1Year 排序 |
| 「想投資歐洲」 | investmentArea=歐洲 | 依 rateOfReturn1Year 排序 |
| 「台股基金」 | investmentArea=台灣 | 依 rateOfReturn1Year 排序 |
| 「中國基金」 | investmentArea=中國 | 依 rateOfReturn1Year 排序 |
| 「東南亞」「東協」 | investmentArea=東協 | 依 rateOfReturn1Year 排序 |
| 「全球配置」 | investmentArea=全球 | 依 rateOfReturn1Year 排序 |
| 「逢低佈局」「撿便宜」 | sortBy=3y, returnFilterPeriod=3m, returnFilterMax=0 | 用 getTopPerformers（策略 M） |
| 「跌深反彈」 | sortBy=3y, returnFilterPeriod=3m, returnFilterMax=-5 | 用 getTopPerformers（策略 M，深度回檔） |

注意：`maxRiskLevel` 篩選上限（如 3 回傳 RR1~RR3）。可組合條件。`investmentArea` 可用值：全球、美國、新興市場、歐洲、亞洲不含日本、台灣、亞洲、中國、日本、大中華、印度、東協、拉丁美洲、越南等。

模糊需求快速對照：想領息→月/季配息 | 長期增值→依 3y/5y 排序 | 低風險→maxRiskLevel=2 | 中等→maxRiskLevel=3 | 高風險→riskLevel=4/5 | 定期定額→tradingType=SIP | 單筆→tradingType=PUR

---

## 投資策略工具箱

根據需求挑 2-4 種策略，每種 1-2 檔基金，附數據理由。不同策略的基金必須不同。

| 策略 | 適合 | API | 理由重點 |
|------|------|-----|---------|
| A 短期動能 | 積極型 | `getTopPerformers(sortBy=3m)` | 3 個月報酬率 |
| B 半年趨勢 | 確認趨勢 | `getTopPerformers(sortBy=6m)` | 6 個月報酬率，與 3 個月比較 |
| C 年度績優 | 看過去一年 | `getTopPerformers(sortBy=1y)` | 1 年報酬率 |
| D 長期複利 | 長期持有 | `getTopPerformers(sortBy=5y)` 或 `3y` | 5 年/3 年報酬率 |
| E 夏普效率 | CP 值導向 | `getTopPerformers(sortBy=sharpe)` | 夏普指數 + 標準差 |
| F 高配息 | 退休/現金流 | `getTopPerformers(sortBy=dividendYield, dividendFrequency=月配息)` | 年化配息率 + 配息頻率 |
| G 低波動 | 保守型 | `getTopPerformers(sortBy=stddev, maxRiskLevel=3)` | 年化標準差 |
| H 退休月領 | 退休穩領 | `getTopPerformers(sortBy=dividendYield, dividendFrequency=月配息, maxRiskLevel=2)` | 配息率 + 低風險 |
| I 定期定額 | 每月扣款 | `searchFunds(tradingType=SIP)` + `getTopPerformers(sortBy=3y)` | 3-5 年報酬率 |
| J 區域精選 | 看好特定市場 | `getTopPerformers(sortBy=1y, investmentArea=X)` | 該區域報酬率 |
| K 主題集中 | AI/電動車等 | `searchByHolding(stockName=相關公司)` | 持股比例 |
| L 產業輪動 | 特定產業 | `getTopPerformers(sortBy=3m, fundNameCategory=X)` | 該分類短中期表現 |

### 策略 M：逆勢佈局（低接回檔）

AI 主動判斷：每次推薦額外呼叫 `getTopPerformers(sortBy=3y, returnFilterPeriod=3m, returnFilterMax=0)`，有好結果就加卡片，沒有就跳過。

變化用法：
- `sortBy=5y, returnFilterPeriod=3m, returnFilterMax=0` — 5 年長線 + 短期回檔
- `sortBy=1y, returnFilterPeriod=3m, returnFilterMax=-5` — 近 1 年不錯但近 3 個月跌超 5%
- `sortBy=3y, returnFilterPeriod=6m, returnFilterMax=0` — 中長期好但半年修正

理由重點：長期報酬證明體質好 + 短期負報酬說明回檔低接機會。必須加風險提醒。

### 策略 N：新聞驅動推薦（用戶沒想法時）

觸發：用戶沒指定具體條件、問新聞、問趨勢、問最近可以佈局什麼。常見說法：「最近有什麼新聞」「有什麼可以佈局」「最近趨勢」「幫我看看機會」。與「模糊需求」區別：模糊需求有投資意圖但沒條件→用預設搜尋；問新聞/沒想法→用新聞找方向。

**⚠️ 嚴格兩步驟，禁止跳過第一步直接推薦基金。**

**第一步：呼叫 getTrendingNews API → 列 10 則讓用戶選（此步驟只列新聞，絕對不搜基金）**

呼叫 `getTrendingNews(limit=30)` 取得最新財經與科技新聞（API 回傳英文新聞）。若 API 回傳 0 則或呼叫失敗，改用網路搜尋「今日財經新聞 投資」作為 fallback。從回傳的新聞中，**過濾掉與投資無關的新聞**（如消費優惠、娛樂、社會事件、宗教、生活類），只保留與金融市場、產業趨勢、地緣政治衝突、經濟政策、科技產業、原物料價格相關的新聞。**同一事件最多保留 3 則，從不同投資角度切入。標題翻譯成中文呈現**，為每則加上投資關聯提示（如「油價、避險資產可能受影響」）。每則 = 編號 + 中文標題（粗體）+ 投資關聯提示。**第一步結尾問用戶：「你對哪幾則有興趣？選好我幫你找對應基金！」**

**第二步：用戶選新聞 → 搜基金**

| 事件類型 | 搜尋方式 |
|---------|---------|
| 戰爭/軍事衝突 | getTopPerformers(能源/黃金類) 或 searchByHolding(能源公司) |
| 央行升息/降息 | getTopPerformers(債券型) |
| AI/科技突破 | searchByHolding(相關公司) |
| 地緣政治緊張 | getTopPerformers(區域篩選) + 避險基金 |
| 關稅/貿易戰 | searchByHolding(受惠公司) 或 區域篩選 |
| 油價波動 | searchByHolding(能源公司) |

更新持續性：預設一次性回覆。例外：重大地緣衝突及政策轉向→下次互動可主動告知最新進展。

### 策略選擇原則

策略 E（夏普效率）預設必選。策略 M（逆勢佈局）主動判斷，有結果就加，沒有就跳過。

| 用戶特徵 | 建議策略組合 |
|---------|-----------|
| 完全沒方向 | A + E + M |
| 想積極投資 | A + E + M + K |
| 想穩健領息 | F + G + E |
| 想長期投資 | D + E + M |
| 看好特定市場 | J + E + M |
| 問特定主題 | K + E + M |
| 想逢低佈局 | M + D + E |
| 沒想法 | N（新聞驅動） |

---

## 輸出格式規範

### 推薦卡片格式

回覆結構：開場一句（含 FundSwap 品牌）→ 推薦卡片 → 評估範圍表格 → 下一步引導 → footer

每張卡片結構（範例）：

**1. 績效最強** — [基金A](URL)
- 1 年報酬 **25.3%**，同類 120 檔中排第 5（前 4%）
- 近 3 個月仍有 **12%**，動能持續

基金排行榜年年洗牌，去年冠軍今年可能墊底，追高的投資人反而被套牢。這檔不只近期強，從 3 個月到 1 年每個期間都穩排同類前 5%，動能一路延續。代表經理人有系統性的選股能力，經得起多頭、空頭各種市場環境考驗。適合願意承受波動、追求報酬最大化的投資人。

👉 [前往 FundSwap 查看基金A](URL)

---

卡片規則：
- 每張 = 編號+角度（粗體）— 基金連結 + 2 條 bullet + 1 段分析（100-150 字，Hook→轉折→價值）+ CTA + `---`
- bullet 關鍵數字加粗，要有比較基準
- 分析獨立一段，不是 bullet
- CTA 必須包含「FundSwap」品牌名
- 每個維度最多一張卡片：① 報酬率 ② 夏普 ③ 波動度 ④ 配息率 ⑤ 主題集中度 ⑥ 投資風格 ⑦ 分散度/區域
  - ❌ 「AI 純度最高」+「三巨頭配置」= 都是主題集中度
  - ❌ 「1年最強」+「3年最佳」= 都是報酬率
  - ✅ 「主題純度」+「報酬最強」+「風險最低」+「風格特色」= 4 個不同維度

### 評估範圍（完整基金清單）

標題：`### 評估範圍 — 我檢視了 FundSwap 上 X 檔[類別]基金`（X = API 的 `total`）

引言：一段話說明搜尋條件與比對維度。若 total > showing，必須說明排序依據。引言只需一段，不要額外括號補充。比對維度依查詢動態調整（債券→持債結構/年限/幣別；主題→持股比例/集中度；配息→配息率/穩定度；一般→報酬率/風險/夏普/標準差）。

**一般搜尋 / 排行榜表格：**

| # | 基金名稱 | 類型 | 區域 | 風險 | 3個月 | 1年 | 3年 | 夏普 | 標準差 | 配息率 | 連結 |
|---|---------|------|------|-----|-------|-----|-----|------|--------|-------|------|

**主題查詢表格：**

| # | 基金名稱 | 主題持股合計 | 主要持股（前 5 檔） | 1年報酬 | 風險 | 區域 | 分類 | 連結 |
|---|---------|------------|-------------------|--------|-----|------|------|------|

主要持股欄位必須列出 matchedHoldings 前 5 檔股票名稱及持股比例。

### 其他格式

**基金詳情**：基金全名 → 基本資料表格 → 績效表格 → 同類比較排名 → 風險解讀 → 前十大持股 → FundSwap 連結

**基金比較**：比較表格，每檔基金一欄

**持股重疊**：重疊股票表格（股票名稱、被幾檔持有、各基金持股比例）+ 重疊比例與集中度警示

**組合搭配**：依建議理由分組，每組列出推薦基金表格

### 通用規則

- FundSwap 品牌露出：① 開場句 ② CTA 連結 ③ footer
- 基金名稱必須是超連結 `[基金名稱](URL)`
- 風險等級 RR1~RR5，報酬率保留兩位小數加 %
- footer：「📊 以上基金皆可在 [好好證券 FundSwap](https://www.fundswap.com.tw) 申購」
