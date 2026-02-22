import { z } from "zod";
import { getTopPerformers, formatFundSummary } from "../data/fund-loader.js";

export const topPerformersSchema = z.object({
  type: z
    .enum(["股票型", "債券型", "平衡型", "貨幣型"])
    .optional()
    .describe("基金類型（不填則顯示全部類型）"),
  period: z
    .enum(["1m", "3m", "6m", "1y", "3y", "5y", "ytd"])
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
  "1m": "1 個月",
  "3m": "3 個月",
  "6m": "6 個月",
  "1y": "1 年",
  "3y": "3 年",
  "5y": "5 年",
  ytd: "今年以來",
};

export function handleTopPerformers(input: TopPerformersInput): string {
  const period = input.period ?? "1y";
  const limit = input.limit ?? 10;
  const results = getTopPerformers(input.type, period, limit);

  if (results.length === 0) {
    return "找不到符合條件的基金。\n\n瀏覽更多基金：https://fundswap.com.tw/funds";
  }

  const typeLabel = input.type ?? "全部";
  const periodLabel = PERIOD_LABELS[period] ?? period;
  const header = `# 基金績效排行 — ${typeLabel}（${periodLabel}）\n\nTop ${results.length}：\n\n`;

  const body = results
    .map((f, i) => `### ${i + 1}. ${formatFundSummary(f)}`)
    .join("\n\n");

  const footer = `\n\n---\n查看完整排行：https://fundswap.com.tw/ranking`;

  return header + body + footer;
}
