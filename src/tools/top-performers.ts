import { z } from "zod";
import { getTopPerformers, formatFundSummary } from "../data/fund-loader.js";

export const topPerformersSchema = z.object({
  investmentTarget: z
    .enum(["股票型", "債券型", "平衡型", "貨幣型"])
    .optional()
    .describe("基金類型（不填則顯示全部類型）"),
  fundNameCategory: z
    .string()
    .optional()
    .describe("基金分類（如：科技、貴金屬、ESG概念）"),
  dividendFrequency: z
    .string()
    .optional()
    .describe("配息頻率（如：月配息、季配息、年配息、不配息）"),
  investmentArea: z
    .string()
    .optional()
    .describe("投資區域（如：全球、美國、日本、台灣、新興市場）"),
  maxRiskLevel: z
    .number()
    .min(1)
    .max(5)
    .optional()
    .describe("最高風險等級（回傳 ≤ 此等級的基金）"),
  sortBy: z
    .enum(["3m", "6m", "1y", "2y", "3y", "5y", "sharpe", "dividendYield", "stddev"])
    .default("1y")
    .describe("排序依據：3m/6m/1y/2y/3y/5y=報酬率期間、sharpe=夏普指數、dividendYield=配息率、stddev=標準差（低→高）"),
  returnFilterPeriod: z
    .enum(["3m", "6m", "1y", "2y", "3y", "5y"])
    .optional()
    .describe("回報區間篩選的期間（搭配 returnFilterMin/Max 使用，例如 3m 篩選 3 個月報酬在指定範圍內的基金）"),
  returnFilterMin: z
    .number()
    .optional()
    .describe("回報區間篩選：最低報酬率（%），低於此值的基金會被排除"),
  returnFilterMax: z
    .number()
    .optional()
    .describe("回報區間篩選：最高報酬率（%），高於此值的基金會被排除。例如設為 0 表示只留負報酬的基金"),
  limit: z
    .number()
    .min(1)
    .max(20)
    .default(10)
    .describe("顯示筆數（預設 10）"),
});

export type TopPerformersInput = z.infer<typeof topPerformersSchema>;

const SORT_LABELS: Record<string, string> = {
  "3m": "3 個月報酬",
  "6m": "6 個月報酬",
  "1y": "1 年報酬",
  "2y": "2 年報酬",
  "3y": "3 年報酬",
  "5y": "5 年報酬",
  sharpe: "夏普指數",
  dividendYield: "配息率",
  stddev: "年化標準差（低→高）",
};

export function handleTopPerformers(input: TopPerformersInput): string {
  const sortBy = input.sortBy ?? "1y";
  const limit = input.limit ?? 10;
  const { funds: results } = getTopPerformers(
    {
      investmentTarget: input.investmentTarget,
      fundNameCategory: input.fundNameCategory,
      dividendFrequency: input.dividendFrequency,
      investmentArea: input.investmentArea,
      maxRiskLevel: input.maxRiskLevel,
      returnFilterPeriod: input.returnFilterPeriod,
      returnFilterMin: input.returnFilterMin,
      returnFilterMax: input.returnFilterMax,
    },
    sortBy,
    limit
  );

  if (results.length === 0) {
    return "找不到符合條件的基金。\n\n瀏覽更多基金：https://www.fundswap.com.tw/trade/funds/";
  }

  const typeLabel = input.investmentTarget ?? "全部";
  const categoryLabel = input.fundNameCategory
    ? ` — ${input.fundNameCategory}`
    : "";
  const sortLabel = SORT_LABELS[sortBy] ?? sortBy;
  const header = `# 基金排行 — ${typeLabel}${categoryLabel}（依${sortLabel}排序）\n\nTop ${results.length}：\n\n`;

  const body = results
    .map((f, i) => `### ${i + 1}. ${formatFundSummary(f)}`)
    .join("\n\n");

  const footer = `\n\n---\n查看完整排行：https://www.fundswap.com.tw/trade/funds/`;

  return header + body + footer;
}
