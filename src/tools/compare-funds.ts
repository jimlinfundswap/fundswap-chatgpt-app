import { z } from "zod";
import { getFundById, type Fund } from "../data/fund-loader.js";

export const compareFundsSchema = z.object({
  fund_ids: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("要比較的基金代碼（2-5 檔）"),
});

export type CompareFundsInput = z.infer<typeof compareFundsSchema>;

export function handleCompareFunds(input: CompareFundsInput): string {
  const funds: Fund[] = [];
  const notFound: string[] = [];

  for (const id of input.fund_ids) {
    const fund = getFundById(id);
    if (fund) {
      funds.push(fund);
    } else {
      notFound.push(id);
    }
  }

  if (funds.length < 2) {
    return `需要至少 2 檔基金才能比較。找不到的代碼：${notFound.join(", ")}\n\n搜尋基金：https://fundswap.com.tw/funds`;
  }

  const header = `# 基金比較（${funds.length} 檔）\n\n`;

  // Build comparison table
  const cols = funds.map((f) => f.name_zh);
  const rows = [
    ["項目", ...cols],
    ["基金代碼", ...funds.map((f) => f.fund_id)],
    ["類型", ...funds.map((f) => f.type)],
    ["風險等級", ...funds.map((f) => f.risk_level)],
    ["投信公司", ...funds.map((f) => f.company)],
    ["最新淨值", ...funds.map((f) => `${f.nav}`)],
    ["管理費", ...funds.map((f) => `${f.management_fee_pct}%`)],
    ["1 個月報酬", ...funds.map((f) => `${f.return_1m_pct}%`)],
    ["3 個月報酬", ...funds.map((f) => `${f.return_3m_pct}%`)],
    ["1 年報酬", ...funds.map((f) => `${f.return_1y_pct}%`)],
    ["3 年報酬", ...funds.map((f) => `${f.return_3y_pct}%`)],
    ["YTD 報酬", ...funds.map((f) => `${f.return_ytd_pct}%`)],
    ["Sharpe Ratio", ...funds.map((f) => `${f.sharpe_ratio}`)],
    ["標準差", ...funds.map((f) => `${f.std_dev_pct}%`)],
    ["最大回撤", ...funds.map((f) => `${f.max_drawdown_pct}%`)],
  ];

  const table = rows
    .map((row) => `| ${row.join(" | ")} |`)
    .join("\n")
    .replace(
      /\n/,
      `\n|${rows[0].map(() => "------").join("|")}|\n`
    );

  const links = funds
    .map(
      (f) =>
        `- ${f.name_zh}：${f.url}`
    )
    .join("\n");

  const footer = [
    "",
    "---",
    "查看完整比較：https://fundswap.com.tw/compare",
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
