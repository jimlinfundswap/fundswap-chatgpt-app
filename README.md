# FundSwap AI 找基金

台灣基金查詢 AI 工具，提供 MCP Server 與 REST API 雙介面，讓 ChatGPT、Claude 等 AI 助手能查詢、比較、篩選台灣共同基金資料。

- 資料來源：[FundSwap 基金交換平台](https://www.fundswap.com.tw)
- 收錄基金：**3,235 檔**台灣可投資基金
- API 位址：`https://fundswap-chatgpt-app-1.vercel.app`

---

## 可查詢的資料

| 資料類型 | 說明 |
|----------|------|
| 基金基本資料 | 名稱、代碼(mfxId)、投信公司、基金類型、分類、投資區域、風險等級 |
| 績效表現 | 近 3 個月 / 6 個月 / 1 年 / 2 年 / 3 年 / 5 年報酬率 |
| 配息資訊 | 配息頻率、年化配息率、配息年報酬率 |
| 風險指標 | 風險等級 RR1~RR5、年化標準差、夏普指數、CP 值 |
| 持股明細 | 前十大持股名稱與佔比 |
| 同類比較 | 同類排名、百分位、同類平均報酬、風險比較 |
| 交易方式 | 單筆申購(PUR)、定期定額(SIP)、轉入(SWI)、轉出(SWO)、贖回(RDM) |

### 篩選條件

| 條件 | 可用值 |
|------|--------|
| 關鍵字 | 基金名稱、代碼、投信公司（模糊搜尋） |
| 基金類型 | 股票型、債券型、平衡型、貨幣型 |
| 風險等級 | 1(RR1) ~ 5(RR5) |
| 投資區域 | 台灣、全球、美國、歐洲、日本、中國、亞太、新興市場 等 |
| 基金分類 | 科技、ESG概念、ETF及指數、大型股票、生技醫療、貴金屬、新能源 等 31 種 |
| 配息頻率 | 月配息、季配息、半年配息、年配息、不配息、未固定配息 |
| 交易方式 | PUR(單筆)、SIP(定期定額) |

---

## API 文件

Base URL: `https://fundswap-chatgpt-app-1.vercel.app`

### 1. 搜尋基金

依條件篩選基金，最多回傳 20 筆。

```
GET /api/search-funds
```

| 參數 | 必填 | 說明 | 範例 |
|------|------|------|------|
| keyword | 否 | 關鍵字搜尋 | `科技`、`ARGG`、`富蘭克林` |
| investmentTarget | 否 | 基金類型 | `股票型` |
| riskLevel | 否 | 風險等級（精確匹配）1~5 | `3` |
| maxRiskLevel | 否 | 風險等級上限（回傳 ≤ 此值的基金） | `3`（回傳 RR1~RR3） |
| investmentArea | 否 | 投資區域 | `美國` |
| fundNameCategory | 否 | 基金分類 | `科技` |
| dividendFrequency | 否 | 配息頻率 | `月配息` |
| tradingType | 否 | 交易方式 | `SIP` |

**範例：**
```
GET /api/search-funds?investmentTarget=股票型&investmentArea=美國&riskLevel=4
GET /api/search-funds?keyword=科技&dividendFrequency=月配息
GET /api/search-funds?maxRiskLevel=2&dividendFrequency=月配息
```

**回傳：**
```json
{
  "total": 45,
  "showing": 20,
  "funds": [
    {
      "mfxId": "ARGG",
      "fundShortName": "富蘭克林坦伯頓全球投資系列...",
      "investmentTarget": "股票型",
      "fundNameCategory": "科技",
      "riskLevel": 4,
      "generalIssuer": "富蘭克林",
      "investmentArea": "全球",
      "dividendFrequency": "不配息",
      "rateOfReturn1Year": 15.23,
      "rateOfReturn3Years": 32.56,
      "tradingType": ["PUR", "SIP"],
      "url": "https://www.fundswap.com.tw/ARGG"
    }
  ]
}
```

---

### 2. 依持股搜尋基金

搜尋持有特定公司股票的基金，依持股佔比排序。適合查「哪些基金有持有 NVIDIA？」這類問題。

```
GET /api/search-by-holding
```

| 參數 | 必填 | 說明 | 範例 |
|------|------|------|------|
| stockName | 是 | 股票/公司名稱，多個用逗號分隔 | `NVIDIA,台積電` |
| investmentTarget | 否 | 限定基金類型 | `股票型` |
| limit | 否 | 回傳筆數（預設 10，最多 20） | `15` |

**範例：**
```
GET /api/search-by-holding?stockName=NVIDIA,台積電
GET /api/search-by-holding?stockName=TSMC&investmentTarget=股票型&limit=5
```

**回傳：**
```json
{
  "query": "NVIDIA,台積電",
  "total": 38,
  "funds": [
    {
      "mfxId": "ED32",
      "fundShortName": "某科技基金...",
      "investmentTarget": "股票型",
      "riskLevel": 4,
      "rateOfReturn1Year": 25.6,
      "matchedHoldings": [
        { "stockName": "NVIDIA CORP", "holdingRatio": 8.52 },
        { "stockName": "台灣積體電路製造", "holdingRatio": 5.31 }
      ],
      "totalMatchedRatio": 13.83,
      "url": "https://www.fundswap.com.tw/ED32"
    }
  ]
}
```

---

### 3. 基金詳情

查詢單一基金的完整資料，包含績效、風險指標、前十大持股、同類排名。

```
GET /api/fund-detail
```

| 參數 | 必填 | 說明 | 範例 |
|------|------|------|------|
| mfxId | 是 | 基金代碼 | `ARGG` |

**範例：**
```
GET /api/fund-detail?mfxId=ARGG
```

**回傳：**
```json
{
  "mfxId": "ARGG",
  "fundShortName": "富蘭克林坦伯頓全球投資系列...",
  "investmentTarget": "股票型",
  "fundNameCategory": "科技",
  "riskLevel": 4,
  "generalIssuer": "富蘭克林",
  "investmentArea": "全球",
  "dividendFrequency": "不配息",
  "costPerformanceValue": 0.85,
  "dividendAnnualizedYield": null,
  "dividendAnnualRateOfReturn": null,
  "returns": {
    "3m": 5.12, "6m": 10.34, "1y": 15.23,
    "2y": 28.45, "3y": 32.56, "5y": 68.90
  },
  "annualizedStandardDeviation": 18.5,
  "stockTop": [
    { "stockName": "NVIDIA CORP", "holdingRatio": 8.52 },
    { "stockName": "APPLE INC", "holdingRatio": 6.21 }
  ],
  "categoryContext": {
    "category": "科技",
    "totalInCategory": 120,
    "rankings": [
      { "period": "1y", "rank": 5, "percentile": 4.17, "categoryAvg": 8.7, "fundReturn": 15.23 },
      { "period": "3y", "rank": 12, "percentile": 10.0, "categoryAvg": 22.1, "fundReturn": 32.56 }
    ],
    "riskComparison": {
      "categoryAvgStdDev": 14.2,
      "fundStdDev": 18.5,
      "interpretation": "高於同類平均（波動較大）"
    }
  },
  "url": "https://www.fundswap.com.tw/ARGG"
}
```

---

### 4. 基金比較

比較 2~5 檔基金的績效與風險指標。

```
POST /api/compare-funds
Content-Type: application/json
```

**Request Body：**
```json
{
  "mfx_ids": ["ARGG", "ED32", "B1F3"]
}
```

**回傳：**
```json
{
  "notFound": [],
  "funds": [
    {
      "mfxId": "ARGG",
      "fundShortName": "...",
      "riskLevel": 4,
      "returns": { "3m": 5.12, "6m": 10.34, "1y": 15.23, "2y": 28.45, "3y": 32.56, "5y": 68.90 },
      "annualizedStandardDeviation": 18.5,
      "url": "https://www.fundswap.com.tw/ARGG"
    }
  ]
}
```

---

### 5. 績效排行

查詢基金績效排行榜，支援多種排序方式與篩選條件。

```
GET /api/top-performers
```

| 參數 | 必填 | 說明 | 範例 |
|------|------|------|------|
| sortBy | 否 | 排序方式（預設 `1y`） | `3m` / `6m` / `1y` / `2y` / `3y` / `5y` / `sharpe` / `dividendYield` / `stddev` |
| investmentTarget | 否 | 基金類型 | `股票型` |
| fundNameCategory | 否 | 基金分類 | `科技` |
| investmentArea | 否 | 投資區域 | `美國` |
| dividendFrequency | 否 | 配息頻率 | `月配息` |
| maxRiskLevel | 否 | 風險等級上限 | `3`（只回傳 RR1~RR3） |
| returnFilterPeriod | 否 | 報酬率篩選期間 | `3m` |
| returnFilterMin | 否 | 該期間最低報酬率 | `-10` |
| returnFilterMax | 否 | 該期間最高報酬率 | `0`（只留負報酬的基金） |
| limit | 否 | 回傳筆數（預設 10，最多 20） | `10` |

**sortBy 說明：**
- `3m` / `6m` / `1y` / `2y` / `3y` / `5y`：依報酬率排序（高→低）
- `sharpe`：依夏普指數排序（高→低，風險效率最佳）
- `dividendYield`：依年化配息率排序（高→低）
- `stddev`：依年化標準差排序（低→高，波動最小）

**範例：**
```
GET /api/top-performers?sortBy=1y&investmentTarget=股票型&limit=10
GET /api/top-performers?sortBy=sharpe&fundNameCategory=科技
GET /api/top-performers?sortBy=dividendYield&dividendFrequency=月配息&maxRiskLevel=2
GET /api/top-performers?sortBy=3y&returnFilterPeriod=3m&returnFilterMax=0
```

**回傳：**
```json
{
  "sortBy": "1y",
  "total": 523,
  "funds": [
    {
      "rank": 1,
      "mfxId": "ED32",
      "fundShortName": "...",
      "investmentTarget": "股票型",
      "investmentArea": "全球",
      "fundNameCategory": "科技",
      "riskLevel": 4,
      "generalIssuer": "富蘭克林",
      "dividendFrequency": "不配息",
      "costPerformanceValue": 0.85,
      "annualizedStandardDeviation": 18.5,
      "dividendAnnualizedYield": null,
      "returns": { "3m": 12.5, "6m": 22.1, "1y": 45.3, "2y": 78.2, "3y": 110.5, "5y": 205.3 },
      "url": "https://www.fundswap.com.tw/ED32"
    }
  ]
}
```

---

### 6. 持股重疊分析

檢查多檔基金的持股是否重疊，評估分散風險效果。

```
POST /api/holdings-overlap
Content-Type: application/json
```

**Request Body：**
```json
{
  "mfx_ids": ["ARGG", "ED32", "B1F3"]
}
```

`mfx_ids` 為 2~5 個基金代碼的陣列。

**回傳：**
```json
{
  "funds": [
    { "mfxId": "ARGG", "fundShortName": "...", "url": "https://www.fundswap.com.tw/ARGG" }
  ],
  "overlapRatio": 45.2,
  "concentrationWarning": "中度重疊：這些基金有相當比例的共同持股，分散效果有限",
  "sharedHoldings": [
    {
      "stockName": "NVIDIA CORP",
      "heldByCount": 3,
      "avgHoldingRatio": 0.0721,
      "details": [
        { "mfxId": "ARGG", "holdingRatio": 8.52 },
        { "mfxId": "ED32", "holdingRatio": 6.31 }
      ]
    }
  ]
}
```

**重疊程度判斷：**
- `overlapRatio` > 50%：高度重疊，建議替換部分基金
- `overlapRatio` > 30%：中度重疊，注意集中風險
- `overlapRatio` < 30%：分散度良好

---

### 7. 組合搭配建議

根據已選基金的特性，建議互補的搭配基金。

```
GET /api/complement-suggestions
```

| 參數 | 必填 | 說明 | 範例 |
|------|------|------|------|
| mfxId | 是 | 已選基金代碼 | `ARGG` |

**範例：**
```
GET /api/complement-suggestions?mfxId=ARGG
```

**回傳：**
```json
{
  "baseFund": {
    "mfxId": "ARGG",
    "fundShortName": "...",
    "investmentTarget": "股票型",
    "riskLevel": 4,
    "investmentArea": "全球",
    "url": "https://www.fundswap.com.tw/ARGG"
  },
  "suggestions": [
    {
      "reason": "股債平衡：您選的是股票型基金，建議搭配債券型降低波動",
      "recommendedFunds": [
        {
          "mfxId": "B1F3",
          "fundShortName": "...",
          "investmentTarget": "債券型",
          "fundNameCategory": "投資等級債",
          "riskLevel": 2,
          "investmentArea": "全球",
          "dividendFrequency": "月配息",
          "rateOfReturn1Year": 5.6,
          "url": "https://www.fundswap.com.tw/B1F3"
        }
      ]
    }
  ]
}
```

---

## 在 AI 助手中使用

### ChatGPT (GPT Actions)

透過 REST API 搭配 OpenAPI spec 接入 ChatGPT Actions。

OpenAPI 規格：`https://fundswap-chatgpt-app-1.vercel.app/openapi.json`

### Claude Desktop (MCP Server)

在 `claude_desktop_config.json` 加入：

```json
{
  "mcpServers": {
    "fundswap": {
      "command": "node",
      "args": ["path/to/fundswap-chatgpt-app/dist/server.js"]
    }
  }
}
```

MCP Server 提供的 Tools：

| Tool | 說明 |
|------|------|
| `search_funds` | 搜尋基金（同 /api/search-funds） |
| `get_fund_detail` | 基金詳情（同 /api/fund-detail） |
| `compare_funds` | 比較基金（同 /api/compare-funds） |
| `get_top_performers` | 績效排行（同 /api/top-performers） |
| `holdings_overlap` | 持股重疊分析（同 /api/holdings-overlap） |
| `complement_suggestions` | 組合搭配建議（同 /api/complement-suggestions） |

---

## Tech Stack

- **TypeScript** + **Node.js** (ES2022)
- **@modelcontextprotocol/sdk** — MCP Server
- **Zod** — 參數驗證
- **Vercel** — Serverless API 部署

## 專案結構

```
├── api/                          # Vercel Serverless API 路由
│   ├── search-funds.ts           # 搜尋基金
│   ├── search-by-holding.ts      # 依持股搜尋
│   ├── fund-detail.ts            # 基金詳情
│   ├── compare-funds.ts          # 基金比較
│   ├── top-performers.ts         # 績效排行
│   ├── holdings-overlap.ts       # 持股重疊分析
│   └── complement-suggestions.ts # 組合搭配建議
├── src/
│   ├── data/fund-loader.ts       # 核心資料載入與篩選邏輯
│   ├── tools/                    # MCP Tool 實作
│   └── server.ts                 # MCP Server 進入點
├── data/
│   ├── funds.json                # 精簡版基金資料 (~6MB, 3,235 檔)
│   └── funds-sample.json         # 原始完整資料 (~20MB)
├── prompts/                      # AI 助手 Prompt 設定
│   ├── chatgpt-instructions.md   # ChatGPT Instructions 欄位
│   ├── chatgpt-knowledge.md      # ChatGPT Knowledge 檔案
│   └── system-prompt.md          # Claude MCP 完整 Prompt
├── scripts/
│   ├── slim-data.cjs             # JSON 精簡腳本
│   └── csv-to-json.ts            # CSV 轉 JSON 工具
├── public/
│   └── openapi.json              # OpenAPI 3.1 規格
└── vercel.json                   # Vercel 部署設定
```

## License

ISC
