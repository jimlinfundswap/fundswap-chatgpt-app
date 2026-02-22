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
  period: z
    .enum(["3m", "6m", "1y", "2y", "3y", "5y"])
    .default("1y")
    .describe("排行期間（預設 1 年）"),
  limit: z
    .number()
    .min(1)
    .max(20)
    .default(10)
    .describe("顯示筆數（預設 10）"),
});

export type TopPerformersInput = z.infer<typeof topPerformersSchema>;

const PERIOD_LABELS: Record<string, string> = {
  "3m": "3 個月",
  "6m": "6 個月",
  "1y": "1 年",
  "2y": "2 年",
  "3y": "3 年",
  "5y": "5 年",
};

export function handleTopPerformers(input: TopPerformersInput): string {
  const period = input.period ?? "1y";
  const limit = input.limit ?? 10;
  const results = getTopPerformers(
    {
      investmentTarget: input.investmentTarget,
      fundNameCategory: input.fundNameCategory,
    },
    period,
    limit
  );

  if (results.length === 0) {
    return "找不到符合條件的基金。\n\n瀏覽更多基金：https://www.fundswap.com.tw/trade/funds/";
  }

  const typeLabel = input.investmentTarget ?? "全部";
  const categoryLabel = input.fundNameCategory
    ? ` — ${input.fundNameCategory}`
    : "";
  const periodLabel = PERIOD_LABELS[period] ?? period;
  const header = `# 基金績效排行 — ${typeLabel}${categoryLabel}（${periodLabel}）\n\nTop ${results.length}：\n\n`;

  const body = results
    .map((f, i) => `### ${i + 1}. ${formatFundSummary(f)}`)
    .join("\n\n");

  const footer = `\n\n---\n查看完整排行：https://www.fundswap.com.tw/trade/funds/`;

  return header + body + footer;
}
