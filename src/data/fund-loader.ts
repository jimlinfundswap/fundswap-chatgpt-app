import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export interface Fund {
  fund_id: string;
  name_zh: string;
  name_en: string;
  type: string;
  company: string;
  manager: string;
  inception_date: string;
  fund_size_billion: number;
  management_fee_pct: number;
  custody_fee_pct: number;
  region: string;
  investment_target: string;
  risk_level: string;
  nav: number;
  nav_date: string;
  return_1m_pct: number;
  return_3m_pct: number;
  return_6m_pct: number;
  return_1y_pct: number;
  return_3y_pct: number;
  return_5y_pct: number;
  return_ytd_pct: number;
  sharpe_ratio: number;
  std_dev_pct: number;
  max_drawdown_pct: number;
  url: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

let funds: Fund[] | null = null;

export function loadFunds(): Fund[] {
  if (funds) return funds;

  const dataPath = resolve(__dirname, "../../data/funds-sample.json");
  const raw = readFileSync(dataPath, "utf-8");
  funds = JSON.parse(raw) as Fund[];
  return funds;
}

export function searchFunds(query: {
  keyword?: string;
  type?: string;
  risk_level?: string;
  region?: string;
}): Fund[] {
  let results = loadFunds();

  if (query.keyword) {
    const kw = query.keyword.toLowerCase();
    results = results.filter(
      (f) =>
        f.name_zh.toLowerCase().includes(kw) ||
        f.name_en.toLowerCase().includes(kw) ||
        f.company.toLowerCase().includes(kw) ||
        f.fund_id.toLowerCase().includes(kw)
    );
  }

  if (query.type) {
    results = results.filter((f) => f.type === query.type);
  }

  if (query.risk_level) {
    results = results.filter((f) => f.risk_level === query.risk_level);
  }

  if (query.region) {
    results = results.filter((f) => f.region.includes(query.region!));
  }

  return results;
}

export function getFundById(fundId: string): Fund | undefined {
  return loadFunds().find((f) => f.fund_id === fundId);
}

export function getTopPerformers(
  type?: string,
  period: string = "1y",
  limit: number = 10
): Fund[] {
  let results = loadFunds();

  if (type) {
    results = results.filter((f) => f.type === type);
  }

  const periodKey = `return_${period}_pct` as keyof Fund;
  return results
    .filter((f) => typeof f[periodKey] === "number")
    .sort((a, b) => (b[periodKey] as number) - (a[periodKey] as number))
    .slice(0, limit);
}

export function formatFundSummary(fund: Fund): string {
  return [
    `**${fund.name_zh}** (${fund.fund_id})`,
    `類型：${fund.type} | 風險等級：${fund.risk_level} | 投信：${fund.company}`,
    `最新淨值：${fund.nav}（${fund.nav_date}）`,
    `報酬率：1M ${fund.return_1m_pct}% | 1Y ${fund.return_1y_pct}% | YTD ${fund.return_ytd_pct}%`,
    "",
    `查看完整資訊：${fund.url}`,
    `立即投資：https://fundswap.com.tw/trade/${fund.fund_id}`,
  ].join("\n");
}

export function formatFundDetail(fund: Fund): string {
  return [
    `# ${fund.name_zh}`,
    `${fund.name_en}`,
    "",
    "## 基本資料",
    `| 項目 | 內容 |`,
    `|------|------|`,
    `| 基金代碼 | ${fund.fund_id} |`,
    `| 基金類型 | ${fund.type} |`,
    `| 投信公司 | ${fund.company} |`,
    `| 經理人 | ${fund.manager} |`,
    `| 成立日期 | ${fund.inception_date} |`,
    `| 基金規模 | ${fund.fund_size_billion} 億 |`,
    `| 管理費 | ${fund.management_fee_pct}% |`,
    `| 保管費 | ${fund.custody_fee_pct}% |`,
    `| 投資區域 | ${fund.region} |`,
    `| 投資標的 | ${fund.investment_target} |`,
    `| 風險等級 | ${fund.risk_level} |`,
    "",
    "## 績效表現",
    `| 期間 | 報酬率 |`,
    `|------|--------|`,
    `| 1 個月 | ${fund.return_1m_pct}% |`,
    `| 3 個月 | ${fund.return_3m_pct}% |`,
    `| 6 個月 | ${fund.return_6m_pct}% |`,
    `| 1 年 | ${fund.return_1y_pct}% |`,
    `| 3 年 | ${fund.return_3y_pct}% |`,
    `| 5 年 | ${fund.return_5y_pct}% |`,
    `| 今年以來 | ${fund.return_ytd_pct}% |`,
    "",
    "## 風險指標",
    `| 指標 | 數值 |`,
    `|------|------|`,
    `| Sharpe Ratio | ${fund.sharpe_ratio} |`,
    `| 標準差 | ${fund.std_dev_pct}% |`,
    `| 最大回撤 | ${fund.max_drawdown_pct}% |`,
    "",
    `最新淨值：**${fund.nav}**（${fund.nav_date}）`,
    "",
    "---",
    `查看完整資訊：${fund.url}`,
    `立即投資：https://fundswap.com.tw/trade/${fund.fund_id}`,
  ].join("\n");
}
