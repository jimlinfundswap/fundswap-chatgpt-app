import { z } from "zod";
import { searchFunds, formatFundSummary } from "../data/fund-loader.js";

export const searchFundsSchema = z.object({
  keyword: z
    .string()
    .optional()
    .describe("搜尋關鍵字（基金名稱、代碼、投信公司）"),
  investmentTarget: z
    .enum(["股票型", "債券型", "平衡型", "貨幣型"])
    .optional()
    .describe("基金類型"),
  riskLevel: z
    .number()
    .min(1)
    .max(5)
    .optional()
    .describe("風險等級（1 最低，5 最高）"),
  investmentArea: z
    .string()
    .optional()
    .describe("投資區域（如：台灣、全球、美國、歐洲）"),
  fundNameCategory: z
    .enum([
      "ESG概念",
      "ETF及指數",
      "大型股票",
      "不分產業(股)",
      "不分產業(債)",
      "中小型股票",
      "中短期債券",
      "公用事業",
      "天然資源",
      "水資源",
      "可轉換債券",
      "生技醫療",
      "企業債券",
      "多元收益(債)",
      "投資等級債",
      "抗通膨債",
      "房地產",
      "股債混合",
      "金融服務",
      "非投資等級債",
      "政府債券",
      "科技",
      "消費服務",
      "能源",
      "貨幣市場",
      "貨幣對沖",
      "貴金屬",
      "新能源",
      "新興市場(股)",
      "新興市場(債)",
      "環境生態",
    ])
    .optional()
    .describe("基金分類（如：科技、貴金屬、ESG概念等）"),
  dividendFrequency: z
    .enum(["不配息", "月配息", "季配息", "半年配息", "年配息", "未固定配息"])
    .optional()
    .describe("配息頻率"),
});

export type SearchFundsInput = z.infer<typeof searchFundsSchema>;

export function handleSearchFunds(input: SearchFundsInput): string {
  const results = searchFunds({
    keyword: input.keyword,
    investmentTarget: input.investmentTarget,
    riskLevel: input.riskLevel,
    investmentArea: input.investmentArea,
    fundNameCategory: input.fundNameCategory,
    dividendFrequency: input.dividendFrequency,
  });

  if (results.length === 0) {
    return "找不到符合條件的基金。請嘗試不同的搜尋條件。\n\n瀏覽更多基金：https://www.fundswap.com.tw/trade/funds/";
  }

  const display = results.slice(0, 20);
  const header = `找到 ${results.length} 檔基金${results.length > 20 ? "（顯示前 20 檔）" : ""}：\n`;
  const body = display.map((f) => formatFundSummary(f)).join("\n---\n");
  const footer = `\n\n瀏覽所有基金：https://www.fundswap.com.tw/trade/funds/`;

  return header + body + footer;
}
