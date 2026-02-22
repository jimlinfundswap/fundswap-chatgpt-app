import { z } from "zod";
import { getFundById, getFundUrl, type Fund } from "../data/fund-loader.js";

export const compareFundsSchema = z.object({
  mfx_ids: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("要比較的基金代碼（2-5 檔）"),
});

export type CompareFundsInput = z.infer<typeof compareFundsSchema>;

export function handleCompareFunds(input: CompareFundsInput): string {
  const funds: Fund[] = [];
  const notFound: string[] = [];

  for (const id of input.mfx_ids) {
    const fund = getFundById(id);
    if (fund) {
      funds.push(fund);
    } else {
      notFound.push(id);
    }
  }

  if (funds.length < 2) {
    return `需要至少 2 檔基金才能比較。找不到的代碼：${notFound.join(", ")}\n\n搜尋基金：https://www.fundswap.com.tw/trade/funds/`;
  }

  const header = `# 基金比較（${funds.length} 檔）\n\n`;

  const cols = funds.map((f) => f.fundShortName);
  const rows = [
    ["項目", ...cols],
    ["基金代碼", ...funds.map((f) => f.mfxId)],
    ["類型", ...funds.map((f) => f.investmentTarget)],
    ["分類", ...funds.map((f) => f.fundNameCategory)],
    ["風險等級", ...funds.map((f) => `RR${f.riskLevel}`)],
    ["投信公司", ...funds.map((f) => f.generalIssuer)],
    ["投資區域", ...funds.map((f) => f.investmentArea)],
    ["配息頻率", ...funds.map((f) => f.dividendFrequency)],
    ["CP 值", ...funds.map((f) => `${f.costPerformanceValue}`)],
    [
      "3 個月報酬",
      ...funds.map((f) => `${f.rateOfReturn3Months?.toFixed(2) ?? "-"}%`),
    ],
    [
      "6 個月報酬",
      ...funds.map((f) => `${f.rateOfReturn6Months?.toFixed(2) ?? "-"}%`),
    ],
    [
      "1 年報酬",
      ...funds.map((f) => `${f.rateOfReturn1Year?.toFixed(2) ?? "-"}%`),
    ],
    [
      "2 年報酬",
      ...funds.map((f) => `${f.rateOfReturn2Year?.toFixed(2) ?? "-"}%`),
    ],
    [
      "3 年報酬",
      ...funds.map((f) => `${f.rateOfReturn3Years?.toFixed(2) ?? "-"}%`),
    ],
    [
      "5 年報酬",
      ...funds.map((f) => `${f.rateOfReturn5Years?.toFixed(2) ?? "-"}%`),
    ],
    [
      "年化標準差",
      ...funds.map(
        (f) => `${f.annualizedStandardDeviation?.toFixed(2) ?? "-"}%`
      ),
    ],
  ];

  const table = rows
    .map((row) => `| ${row.join(" | ")} |`)
    .join("\n")
    .replace(/\n/, `\n|${rows[0].map(() => "------").join("|")}|\n`);

  const links = funds
    .map((f) => `- ${f.fundShortName}：${getFundUrl(f.mfxId)}`)
    .join("\n");

  const footer = [
    "",
    "---",
    "查看完整比較：https://www.fundswap.com.tw/trade/funds/",
    links,
  ].join("\n");

  if (notFound.length > 0) {
    return (
      header +
      table +
      `\n\n（找不到的代碼：${notFound.join(", ")}）` +
      footer
    );
  }

  return header + table + footer;
}
