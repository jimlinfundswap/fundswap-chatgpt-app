import { z } from "zod";
import { analyzeHoldingsOverlap, getFundUrl } from "../data/fund-loader.js";

export const holdingsOverlapSchema = z.object({
  mfx_ids: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("要檢查持股重疊的基金代碼（2-5 檔）"),
});

export type HoldingsOverlapInput = z.infer<typeof holdingsOverlapSchema>;

export function handleHoldingsOverlap(input: HoldingsOverlapInput): string {
  const result = analyzeHoldingsOverlap(input.mfx_ids);

  if (!result || result.funds.length < 2) {
    return "需要至少 2 檔有效基金才能檢查持股重疊。\n\n搜尋基金：https://www.fundswap.com.tw/trade/funds/";
  }

  const lines = [
    `# 持股重疊分析（${result.funds.length} 檔基金）`,
    "",
    "## 分析基金",
    ...result.funds.map(
      (f) =>
        `- **${f.fundShortName}** (${f.mfxId})：${f.holdingCount} 檔持股`
    ),
    "",
    `**重疊比例：${result.overlapRatio}%**`,
  ];

  if (result.concentrationWarning) {
    lines.push("", `> ⚠️ ${result.concentrationWarning}`);
  }

  if (result.sharedHoldings.length > 0) {
    lines.push(
      "",
      "## 重疊持股明細",
      "| 股票名稱 | 持有基金數 | 各基金持股比例 |",
      "|----------|-----------|--------------|"
    );
    for (const s of result.sharedHoldings) {
      const details = s.funds
        .map((f) => `${f.mfxId}: ${(f.holdingRatio * 100).toFixed(2)}%`)
        .join(", ");
      lines.push(`| ${s.stockName} | ${s.funds.length} 檔 | ${details} |`);
    }
  } else {
    lines.push("", "這些基金的前十大持股完全沒有重疊，分散度良好。");
  }

  const links = result.funds
    .map((f) => `- ${f.fundShortName}：${getFundUrl(f.mfxId)}`)
    .join("\n");
  lines.push("", "---", links);

  return lines.join("\n");
}
