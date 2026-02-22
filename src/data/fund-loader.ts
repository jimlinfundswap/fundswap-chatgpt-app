import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface StockHolding {
  stock_name: string;
  holding_ratio: number;
}

export interface Fund {
  mfxId: string;
  fundShortName: string;
  generalIssuer: string;
  fundNameCategory: string;
  investmentArea: string;
  investmentTarget: string;
  riskLevel: number;
  dividendFrequency: string;
  annualizedStandardDeviation: number;
  costPerformanceValue: number;
  dividendAnnualizedYield: number | null;
  dividendAnnualRateOfReturn: number | null;
  rateOfReturn3Months: number;
  rateOfReturn6Months: number;
  rateOfReturn1Year: number;
  rateOfReturn2Year: number;
  rateOfReturn3Years: number;
  rateOfReturn5Years: number;
  tradingType: string[];
  stockTop: StockHolding[];
}

let funds: Fund[] | null = null;

export function loadFunds(): Fund[] {
  if (funds) return funds;

  const dataPath = resolve(process.cwd(), "data/funds-sample.json");
  const raw = readFileSync(dataPath, "utf-8");
  const parsed = JSON.parse(raw) as Record<string, unknown>[];

  funds = parsed.map((item) => ({
    ...item,
    stockTop: Array.isArray(item.stockTop)
      ? (item.stockTop as Record<string, unknown>[]).map((s) => ({
          stock_name: s.stock_name as string,
          holding_ratio: s.holding_ratio as number,
        }))
      : [],
  })) as Fund[];

  return funds;
}

export function searchFunds(query: {
  keyword?: string;
  investmentTarget?: string;
  riskLevel?: number;
  investmentArea?: string;
  fundNameCategory?: string;
  dividendFrequency?: string;
  tradingType?: string;
}): Fund[] {
  let results = loadFunds();

  if (query.keyword) {
    const kw = query.keyword.toLowerCase();
    results = results.filter(
      (f) =>
        f.fundShortName.toLowerCase().includes(kw) ||
        f.generalIssuer.toLowerCase().includes(kw) ||
        f.mfxId.toLowerCase().includes(kw)
    );
  }

  if (query.investmentTarget) {
    results = results.filter(
      (f) => f.investmentTarget === query.investmentTarget
    );
  }

  if (query.riskLevel) {
    results = results.filter((f) => f.riskLevel === query.riskLevel);
  }

  if (query.investmentArea) {
    results = results.filter((f) =>
      f.investmentArea.includes(query.investmentArea!)
    );
  }

  if (query.fundNameCategory) {
    results = results.filter(
      (f) => f.fundNameCategory === query.fundNameCategory
    );
  }

  if (query.dividendFrequency) {
    results = results.filter(
      (f) => f.dividendFrequency === query.dividendFrequency
    );
  }

  if (query.tradingType) {
    results = results.filter((f) =>
      f.tradingType.includes(query.tradingType!)
    );
  }

  return results;
}

export function getFundById(mfxId: string): Fund | undefined {
  return loadFunds().find((f) => f.mfxId === mfxId);
}

const PERIOD_KEY_MAP: Record<string, keyof Fund> = {
  "3m": "rateOfReturn3Months",
  "6m": "rateOfReturn6Months",
  "1y": "rateOfReturn1Year",
  "2y": "rateOfReturn2Year",
  "3y": "rateOfReturn3Years",
  "5y": "rateOfReturn5Years",
};

export function getTopPerformers(
  filters: { investmentTarget?: string; fundNameCategory?: string },
  period: string = "1y",
  limit: number = 10
): Fund[] {
  let results = loadFunds();

  if (filters.investmentTarget) {
    results = results.filter(
      (f) => f.investmentTarget === filters.investmentTarget
    );
  }

  if (filters.fundNameCategory) {
    results = results.filter(
      (f) => f.fundNameCategory === filters.fundNameCategory
    );
  }

  const periodKey = PERIOD_KEY_MAP[period];
  if (!periodKey) return [];

  return results
    .filter((f) => typeof f[periodKey] === "number")
    .sort((a, b) => (b[periodKey] as number) - (a[periodKey] as number))
    .slice(0, limit);
}

export interface HoldingMatch {
  fund: Fund;
  matchedHoldings: StockHolding[];
  totalMatchedRatio: number;
}

export function searchByHolding(query: {
  stockName: string;
  investmentTarget?: string;
  limit?: number;
}): HoldingMatch[] {
  let allFunds = loadFunds();

  if (query.investmentTarget) {
    allFunds = allFunds.filter(
      (f) => f.investmentTarget === query.investmentTarget
    );
  }

  const keywords = query.stockName
    .toLowerCase()
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const matches: HoldingMatch[] = [];

  for (const fund of allFunds) {
    const matchedHoldings = fund.stockTop.filter((s) =>
      keywords.some((kw) => s.stock_name.toLowerCase().includes(kw))
    );

    if (matchedHoldings.length > 0) {
      const totalMatchedRatio = matchedHoldings.reduce(
        (sum, h) => sum + h.holding_ratio,
        0
      );
      matches.push({ fund, matchedHoldings, totalMatchedRatio });
    }
  }

  matches.sort((a, b) => b.totalMatchedRatio - a.totalMatchedRatio);

  const limit = query.limit ?? 10;
  return matches.slice(0, limit);
}

export function getFundUrl(mfxId: string): string {
  return `https://www.fundswap.com.tw/trade/funds/${mfxId}/`;
}

export function formatFundSummary(fund: Fund): string {
  return [
    `**${fund.fundShortName}** (${fund.mfxId})`,
    `類型：${fund.investmentTarget} | 分類：${fund.fundNameCategory} | 風險等級：RR${fund.riskLevel}`,
    `投信：${fund.generalIssuer} | 區域：${fund.investmentArea} | 配息：${fund.dividendFrequency}`,
    `報酬率：3M ${fund.rateOfReturn3Months?.toFixed(2) ?? "-"}% | 1Y ${fund.rateOfReturn1Year?.toFixed(2) ?? "-"}% | 3Y ${fund.rateOfReturn3Years?.toFixed(2) ?? "-"}%`,
    "",
    `查看完整資訊：${getFundUrl(fund.mfxId)}`,
  ].join("\n");
}

export function formatFundDetail(fund: Fund): string {
  const lines = [
    `# ${fund.fundShortName}`,
    "",
    "## 基本資料",
    `| 項目 | 內容 |`,
    `|------|------|`,
    `| 基金代碼 | ${fund.mfxId} |`,
    `| 基金類型 | ${fund.investmentTarget} |`,
    `| 基金分類 | ${fund.fundNameCategory} |`,
    `| 投信公司 | ${fund.generalIssuer} |`,
    `| 投資區域 | ${fund.investmentArea} |`,
    `| 風險等級 | RR${fund.riskLevel} |`,
    `| 配息頻率 | ${fund.dividendFrequency} |`,
    `| CP 值 | ${fund.costPerformanceValue} |`,
    "",
    "## 績效表現",
    `| 期間 | 報酬率 |`,
    `|------|--------|`,
    `| 3 個月 | ${fund.rateOfReturn3Months?.toFixed(2) ?? "-"}% |`,
    `| 6 個月 | ${fund.rateOfReturn6Months?.toFixed(2) ?? "-"}% |`,
    `| 1 年 | ${fund.rateOfReturn1Year?.toFixed(2) ?? "-"}% |`,
    `| 2 年 | ${fund.rateOfReturn2Year?.toFixed(2) ?? "-"}% |`,
    `| 3 年 | ${fund.rateOfReturn3Years?.toFixed(2) ?? "-"}% |`,
    `| 5 年 | ${fund.rateOfReturn5Years?.toFixed(2) ?? "-"}% |`,
    "",
    "## 風險指標",
    `| 指標 | 數值 |`,
    `|------|------|`,
    `| 年化標準差 | ${fund.annualizedStandardDeviation?.toFixed(2) ?? "-"}% |`,
  ];

  if (fund.dividendAnnualizedYield != null) {
    lines.push(
      `| 配息年化殖利率 | ${fund.dividendAnnualizedYield.toFixed(2)}% |`
    );
  }
  if (fund.dividendAnnualRateOfReturn != null) {
    lines.push(
      `| 配息年化報酬率 | ${fund.dividendAnnualRateOfReturn.toFixed(2)}% |`
    );
  }

  if (fund.stockTop.length > 0) {
    lines.push("", "## 前十大持股", `| 股票名稱 | 持股比例 |`, `|----------|----------|`);
    for (const s of fund.stockTop) {
      lines.push(
        `| ${s.stock_name} | ${(s.holding_ratio * 100).toFixed(2)}% |`
      );
    }
  }

  lines.push(
    "",
    "---",
    `查看完整資訊：${getFundUrl(fund.mfxId)}`,
    `立即投資：${getFundUrl(fund.mfxId)}`
  );

  return lines.join("\n");
}
