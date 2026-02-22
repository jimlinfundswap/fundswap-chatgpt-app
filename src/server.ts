import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { searchFundsSchema, handleSearchFunds } from "./tools/search-funds.js";
import { fundDetailSchema, handleFundDetail } from "./tools/fund-detail.js";
import {
  compareFundsSchema,
  handleCompareFunds,
} from "./tools/compare-funds.js";
import {
  topPerformersSchema,
  handleTopPerformers,
} from "./tools/top-performers.js";

const server = new McpServer({
  name: "FundSwap",
  version: "1.0.0",
  description:
    "查詢台灣基金資料、績效比較與排行。資料來源：FundSwap (fundswap.com.tw)",
});

// Tool: search_funds
server.tool(
  "search_funds",
  "搜尋基金。可依關鍵字、基金類型、基金分類、風險等級、投資區域、配息頻率篩選。",
  searchFundsSchema.shape,
  async (input) => ({
    content: [{ type: "text", text: handleSearchFunds(input) }],
  })
);

// Tool: get_fund_detail
server.tool(
  "get_fund_detail",
  "查詢單一基金的完整資料，包含基本資料、績效表現、風險指標、前十大持股。",
  fundDetailSchema.shape,
  async (input) => ({
    content: [{ type: "text", text: handleFundDetail(input) }],
  })
);

// Tool: compare_funds
server.tool(
  "compare_funds",
  "比較 2-5 檔基金的績效、風險指標與配息資訊。",
  compareFundsSchema.shape,
  async (input) => ({
    content: [{ type: "text", text: handleCompareFunds(input) }],
  })
);

// Tool: get_top_performers
server.tool(
  "get_top_performers",
  "查詢基金績效排行榜，可依基金類型、基金分類與期間篩選。",
  topPerformersSchema.shape,
  async (input) => ({
    content: [{ type: "text", text: handleTopPerformers(input) }],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("FundSwap MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
