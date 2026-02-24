# FundSwap ChatGPT App

基金查詢導流工具，提供 MCP Server（供 Claude Desktop）與 REST API（供 ChatGPT Actions）兩種介面。

## 技術棧

- **Language**: TypeScript (ES2022, NodeNext modules)
- **Runtime**: Node.js
- **Deployment**: Vercel Serverless Functions
- **MCP SDK**: @modelcontextprotocol/sdk (stdio transport)
- **Validation**: Zod
- **Production URL**: https://fundswap-chatgpt-app-1.vercel.app

## 專案結構

```
src/
  server.ts              # MCP Server 入口 (stdio transport)
  data/fund-loader.ts    # 核心資料層：載入、搜尋、排序、格式化
  tools/                 # MCP tool handlers (search-funds, fund-detail, compare-funds, top-performers)
api/                     # Vercel Serverless endpoints (5 個 REST API)
data/
  funds-sample.json      # 原始基金資料 (~20MB, 3235 筆)
  funds.json             # 精簡後資料 (~6MB) — 實際被 app 使用
scripts/
  slim-data.cjs          # funds-sample.json → funds.json 轉換腳本
public/
  openapi.json           # OpenAPI 3.1 spec (供 ChatGPT Actions)
```

## 資料流程

```
funds-sample.json → node scripts/slim-data.cjs → funds.json → fund-loader.ts → MCP Tools / REST API
```

### 更新基金資料流程

當使用者提供新的 `funds-sample.json` 後，依序執行：

1. **產生精簡資料**：執行 `node scripts/slim-data.cjs`，從 `funds-sample.json` 產生 `funds.json`
   - 若 shell 環境找不到 node，可用 Python 執行等價邏輯（保留相同欄位，stockTop 只留 stock_name + holding_ratio）
2. **驗證資料**：確認 `funds.json` 的基金筆數與檔案大小合理
3. **Commit**：`git add data/funds-sample.json data/funds.json && git commit`
4. **Push**：`git push origin main`
5. **部署確認**：呼叫線上 API 驗證資料已更新
   - `GET https://fundswap-chatgpt-app-1.vercel.app/api/search-funds` → 檢查 `total` 是否為最新筆數
6. **MCP Server**：若本地有跑 Claude Desktop MCP，需重新 `npm run build` 並重啟

## 常用指令

```bash
npm run build        # TypeScript 編譯 (tsc → dist/)
npm run dev          # 本地開發 MCP Server (tsx)
npm start            # 執行編譯後的 MCP Server
node scripts/slim-data.cjs  # 重新產生精簡資料
```

## 開發注意事項

- `data/funds.json` 由腳本產生，不要手動編輯
- fund-loader.ts 使用 `import ... with { type: "json" }` 載入 JSON，避免 readFileSync
- API endpoints 在 `api/` 目錄，每個檔案是獨立的 Vercel Serverless Function
- MCP tools 在 `src/tools/`，schema 使用 Zod 定義
- 所有 API 回傳最多 20 筆結果，避免 response 過大
- commit message 使用中文，格式：`type: 描述`
