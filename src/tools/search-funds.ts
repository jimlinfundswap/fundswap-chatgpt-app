import { z } from "zod";
import { searchFunds, formatFundSummary } from "../data/fund-loader.js";

export const searchFundsSchema = z.object({
  keyword: z
    .string()
    .optional()
    .describe("搜尋關鍵字（基金名稱、代碼、投信公司）"),
  type: z
    .enum(["股票型", "債券型", "平衡型", "貨幣型"])
    .optional()
    .describe("基金類型"),
  risk_level: z
    .enum(["RR1", "RR2", "RR3", "RR4", "RR5"])
    .optional()
    .describe("風險等級（RR1 最低，RR5 最高）"),
  region: z.string().optional().describe("投資區域（如：台灣、全球、美國）"),
});

export type SearchFundsInput = z.infer<typeof searchFundsSchema>;

export function handleSearchFunds(input: SearchFundsInput): string {
  const results = searchFunds({
    keyword: input.keyword,
    type: input.type,
    risk_level: input.risk_level,
    region: input.region,
  });

  if (results.length === 0) {
    return "找不到符合條件的基金。請嘗試不同的搜尋條件。\n\n瀏覽更多基金：https://fundswap.com.tw/funds";
  }

  const header = `找到 ${results.length} 檔基金：\n`;
  const body = results.map((f) => formatFundSummary(f)).join("\n---\n");
  const footer = `\n\n瀏覽所有基金：https://fundswap.com.tw/funds`;

  return header + body + footer;
}
