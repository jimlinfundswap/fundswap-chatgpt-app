import { z } from "zod";
import {
  getComplementProfile,
  searchFunds,
  formatFundSummary,
} from "../data/fund-loader.js";

export const complementSuggestionsSchema = z.object({
  mfxId: z.string().describe("已選定的基金代碼"),
});

export type ComplementSuggestionsInput = z.infer<
  typeof complementSuggestionsSchema
>;

export function handleComplementSuggestions(
  input: ComplementSuggestionsInput
): string {
  const profile = getComplementProfile(input.mfxId);

  if (!profile) {
    return `找不到基金代碼 ${input.mfxId}。\n\n搜尋基金：https://www.fundswap.com.tw/trade/funds/`;
  }

  const lines = [
    "# 組合搭配建議",
    "",
    `已選基金：**${profile.baseFund.fundShortName}** (${profile.baseFund.mfxId})`,
    `類型：${profile.baseFund.investmentTarget} | 區域：${profile.baseFund.investmentArea} | 風險：RR${profile.baseFund.riskLevel}`,
    "",
  ];

  for (const suggestion of profile.suggestions) {
    lines.push(`## ${suggestion.reason}`);
    const results = searchFunds(
      suggestion.searchParams as Parameters<typeof searchFunds>[0]
    );
    const top3 = results
      .sort(
        (a, b) => (b.rateOfReturn1Year ?? 0) - (a.rateOfReturn1Year ?? 0)
      )
      .slice(0, 3);

    if (top3.length > 0) {
      for (const f of top3) {
        lines.push(formatFundSummary(f));
        lines.push("---");
      }
    } else {
      lines.push("（此條件下暫無推薦）");
    }
    lines.push("");
  }

  lines.push(
    `\n瀏覽更多基金：https://www.fundswap.com.tw/trade/funds/`
  );

  return lines.join("\n");
}
