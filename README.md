# FundSwap ChatGPT App

基金查詢導流工具，基於 MCP (Model Context Protocol) 與 REST API 雙介面架構，讓 ChatGPT、Claude 等 AI 助手能查詢、比較台灣基金資料。

資料來源：[FundSwap](https://www.fundswap.com.tw)

## 功能

| 功能 | MCP Tool | REST API |
|------|----------|----------|
| 搜尋基金 | `search_funds` | `GET /api/search-funds` |
| 基金詳情 | `get_fund_detail` | `GET /api/fund-detail` |
| 基金比較 | `compare_funds` | `POST /api/compare-funds` |
| 績效排行 | `get_top_performers` | `GET /api/top-performers` |
| 持股搜尋 | — | `GET /api/search-by-holding` |

### 篩選條件

- 關鍵字（基金名稱、代碼、投信公司）
- 基金類型：股票型、債券型、平衡型、貨幣型
- 風險等級：RR1 ~ RR5
- 投資區域：台灣、全球、美國、歐洲等
- 基金分類：科技、ESG、貴金屬等 31 種
- 配息頻率：月配息、季配息、半年配息、年配息、不配息
- 交易類別：PUR（單筆）、SIP（定期定額）

## Tech Stack

- **TypeScript** + **Node.js** (ES2022)
- **@modelcontextprotocol/sdk** — MCP Server 實作
- **Zod** — 參數驗證
- **Vercel** — Serverless API 部署

## 快速開始

```bash
npm install
```

### MCP Server（本地開發）

```bash
npm run dev       # 以 tsx 啟動 MCP Server (stdio)
npm run build     # 編譯 TypeScript
npm start         # 以 node 執行編譯後的 server
```

### REST API（Vercel）

API 部署在 Vercel，各路由為獨立 Serverless Function：

```
GET  /api/search-funds?keyword=科技&riskLevel=3
GET  /api/fund-detail?mfxId=ARGG
POST /api/compare-funds        body: { "mfxIds": ["ARGG", "ED32"] }
GET  /api/top-performers?investmentTarget=股票型&period=1Y&limit=10
GET  /api/search-by-holding?stockName=NVIDIA,台積電
```

OpenAPI 規格：`/openapi.json`

## 在 AI 助手中使用

### Claude Desktop

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

### ChatGPT

透過 REST API 搭配 OpenAPI spec 接入 ChatGPT Actions。

## 專案結構

```
├── api/                    # Vercel Serverless API 路由
├── src/
│   ├── data/fund-loader.ts # 核心資料載入與篩選邏輯
│   ├── tools/              # MCP Tool 實作
│   └── server.ts           # MCP Server 進入點
├── data/
│   └── funds.json          # 基金資料 (~1,086 檔)
├── public/
│   └── openapi.json        # OpenAPI 3.1 規格
└── scripts/                # 資料轉換工具
```

## License

ISC
