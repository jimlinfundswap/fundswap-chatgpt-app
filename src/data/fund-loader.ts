import fundsData from "../../data/funds.json" with { type: "json" };

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

const funds = fundsData as unknown as Fund[];

export function loadFunds(): Fund[] {
  return funds;
}

export function searchFunds(query: {
  keyword?: string;
  investmentTarget?: string;
  riskLevel?: number;
  maxRiskLevel?: number;
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

  if (query.maxRiskLevel) {
    results = results.filter((f) => f.riskLevel <= query.maxRiskLevel!);
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

  return deduplicateFunds(results, (f) => f);
}

export function getFundById(mfxId: string): Fund | undefined {
  return loadFunds().find((f) => f.mfxId === mfxId);
}

// === 多級別基金去重 ===
// 同一檔基金常有多個幣別/級別（如 美元、新台幣、累積型、配息型），
// 持股（stockTop）完全相同。搜尋結果只保留每組的第一筆（排序最佳者）。

function getFundFingerprint(fund: Fund): string {
  return fund.stockTop
    .map((s) => s.stock_name)
    .sort()
    .join("|");
}

export function deduplicateFunds<T>(items: T[], getFund: (item: T) => Fund): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const fp = getFundFingerprint(getFund(item));
    if (!seen.has(fp)) {
      seen.add(fp);
      result.push(item);
    }
  }
  return result;
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

  const sorted = results
    .filter((f) => typeof f[periodKey] === "number")
    .sort((a, b) => (b[periodKey] as number) - (a[periodKey] as number));

  return deduplicateFunds(sorted, (f) => f).slice(0, limit);
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

  const deduped = deduplicateFunds(matches, (m) => m.fund);
  const limit = query.limit ?? 10;
  return deduped.slice(0, limit);
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

// === Feature 2: 數字解讀 — 同類排名與風險比較 ===

export interface CategoryStats {
  category: string;
  totalInCategory: number;
  rankings: {
    period: string;
    rank: number;
    percentile: number;
    categoryAvg: number;
    fundReturn: number;
  }[];
  riskComparison: {
    categoryAvgStdDev: number;
    fundStdDev: number;
    interpretation: string;
  };
}

export function getCategoryStats(fund: Fund): CategoryStats {
  const sameCat = loadFunds().filter(
    (f) => f.fundNameCategory === fund.fundNameCategory
  );
  const totalInCategory = sameCat.length;

  const periods = ["3m", "6m", "1y", "2y", "3y", "5y"] as const;

  const rankings = periods.map((period) => {
    const key = PERIOD_KEY_MAP[period];
    const withValues = sameCat.filter((f) => typeof f[key] === "number");
    const sorted = [...withValues].sort(
      (a, b) => (b[key] as number) - (a[key] as number)
    );
    const rank = sorted.findIndex((f) => f.mfxId === fund.mfxId) + 1;
    const avg =
      withValues.reduce((sum, f) => sum + (f[key] as number), 0) /
      (withValues.length || 1);
    const fundReturn = (fund[key] as number) ?? 0;
    const percentile =
      rank > 0 ? Math.round((rank / withValues.length) * 100) : 0;

    return { period, rank, percentile, categoryAvg: avg, fundReturn };
  });

  const stdDevValues = sameCat
    .filter((f) => typeof f.annualizedStandardDeviation === "number")
    .map((f) => f.annualizedStandardDeviation);
  const categoryAvgStdDev =
    stdDevValues.reduce((sum, v) => sum + v, 0) / (stdDevValues.length || 1);
  const fundStdDev = fund.annualizedStandardDeviation ?? 0;
  const diff = fundStdDev - categoryAvgStdDev;
  let interpretation: string;
  if (Math.abs(diff) < 1) {
    interpretation = "接近同類平均";
  } else if (diff < 0) {
    interpretation = "低於同類平均（波動較小）";
  } else {
    interpretation = "高於同類平均（波動較大）";
  }

  return {
    category: fund.fundNameCategory,
    totalInCategory,
    rankings,
    riskComparison: { categoryAvgStdDev, fundStdDev, interpretation },
  };
}

// === Feature 4: 持股重疊檢查 ===

export interface OverlapStock {
  stockName: string;
  funds: { mfxId: string; fundShortName: string; holdingRatio: number }[];
  avgHoldingRatio: number;
}

export interface HoldingsOverlapResult {
  funds: { mfxId: string; fundShortName: string; holdingCount: number }[];
  sharedHoldings: OverlapStock[];
  overlapRatio: number;
  concentrationWarning: string | null;
}

export function analyzeHoldingsOverlap(
  mfxIds: string[]
): HoldingsOverlapResult | null {
  const foundFunds = mfxIds
    .map((id) => getFundById(id))
    .filter(Boolean) as Fund[];
  if (foundFunds.length < 2) return null;

  const stockMap = new Map<
    string,
    { mfxId: string; fundShortName: string; holdingRatio: number }[]
  >();

  for (const fund of foundFunds) {
    for (const stock of fund.stockTop) {
      const name = stock.stock_name.toUpperCase().trim();
      if (!stockMap.has(name)) {
        stockMap.set(name, []);
      }
      stockMap.get(name)!.push({
        mfxId: fund.mfxId,
        fundShortName: fund.fundShortName,
        holdingRatio: stock.holding_ratio,
      });
    }
  }

  const sharedHoldings: OverlapStock[] = [];
  for (const [stockName, holders] of stockMap) {
    if (holders.length >= 2) {
      const avgHoldingRatio =
        holders.reduce((sum, h) => sum + h.holdingRatio, 0) / holders.length;
      sharedHoldings.push({ stockName, funds: holders, avgHoldingRatio });
    }
  }

  sharedHoldings.sort(
    (a, b) =>
      b.funds.length - a.funds.length || b.avgHoldingRatio - a.avgHoldingRatio
  );

  const totalUniqueStocks = stockMap.size;
  const overlapRatio =
    totalUniqueStocks > 0
      ? Number(((sharedHoldings.length / totalUniqueStocks) * 100).toFixed(1))
      : 0;

  let concentrationWarning: string | null = null;
  if (overlapRatio > 50) {
    concentrationWarning =
      "高度重疊：這些基金的持股重疊超過 50%，分散效果有限，建議考慮不同類型或區域的基金。";
  } else if (overlapRatio > 30) {
    concentrationWarning =
      "中度重疊：這些基金有一定程度的持股重疊，可考慮搭配不同產業或區域的基金增加分散度。";
  }

  return {
    funds: foundFunds.map((f) => ({
      mfxId: f.mfxId,
      fundShortName: f.fundShortName,
      holdingCount: f.stockTop.length,
    })),
    sharedHoldings: sharedHoldings.slice(0, 20),
    overlapRatio,
    concentrationWarning,
  };
}

// === Feature 5: 組合搭配建議 ===

export interface ComplementSuggestion {
  reason: string;
  searchParams: Record<string, string | number>;
}

export interface ComplementProfile {
  baseFund: {
    mfxId: string;
    fundShortName: string;
    investmentTarget: string;
    investmentArea: string;
    riskLevel: number;
    fundNameCategory: string;
  };
  suggestions: ComplementSuggestion[];
}

export function getComplementProfile(
  mfxId: string
): ComplementProfile | null {
  const fund = getFundById(mfxId);
  if (!fund) return null;

  const suggestions: ComplementSuggestion[] = [];

  if (fund.investmentTarget === "股票型") {
    suggestions.push({
      reason:
        "股債平衡：您選的是股票型基金，建議搭配債券型基金降低波動",
      searchParams: {
        investmentTarget: "債券型",
        maxRiskLevel: Math.max(1, fund.riskLevel - 1),
      },
    });
  } else if (fund.investmentTarget === "債券型") {
    suggestions.push({
      reason:
        "增加成長性：您選的是債券型基金，建議搭配股票型基金提升報酬",
      searchParams: {
        investmentTarget: "股票型",
        maxRiskLevel: Math.min(5, fund.riskLevel + 1),
      },
    });
  }

  if (fund.investmentArea !== "全球") {
    suggestions.push({
      reason: `區域分散：您選的基金投資${fund.investmentArea}，建議搭配不同區域`,
      searchParams: { investmentArea: "全球" },
    });
  } else {
    suggestions.push({
      reason:
        "區域聚焦：您選的是全球型基金，可搭配特定區域基金加強配置",
      searchParams: { investmentArea: "美國" },
    });
  }

  if (fund.riskLevel >= 4) {
    suggestions.push({
      reason: `降低風險：您選的基金風險較高(RR${fund.riskLevel})，建議搭配低風險基金穩定組合`,
      searchParams: { maxRiskLevel: 2 },
    });
  }

  if (fund.dividendFrequency === "不配息") {
    suggestions.push({
      reason: "增加現金流：您選的基金不配息，建議搭配配息型基金",
      searchParams: { dividendFrequency: "月配息" },
    });
  }

  if (fund.fundNameCategory === "科技") {
    suggestions.push({
      reason:
        "產業分散：您選的是科技類基金，建議搭配非科技類分散風險",
      searchParams: { fundNameCategory: "不分產業(股)" },
    });
  }

  return {
    baseFund: {
      mfxId: fund.mfxId,
      fundShortName: fund.fundShortName,
      investmentTarget: fund.investmentTarget,
      investmentArea: fund.investmentArea,
      riskLevel: fund.riskLevel,
      fundNameCategory: fund.fundNameCategory,
    },
    suggestions,
  };
}

// === Formatting ===

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

const PERIOD_LABEL: Record<string, string> = {
  "3m": "3 個月",
  "6m": "6 個月",
  "1y": "1 年",
  "2y": "2 年",
  "3y": "3 年",
  "5y": "5 年",
};

export function formatFundDetailWithContext(fund: Fund): string {
  const base = formatFundDetail(fund);
  const stats = getCategoryStats(fund);

  const contextLines = [
    "",
    "## 同類比較",
    `此基金屬於「${stats.category}」分類，共 ${stats.totalInCategory} 檔基金。`,
    "",
    "| 期間 | 本基金報酬 | 同類平均 | 排名 | 百分位 |",
    "|------|-----------|---------|------|--------|",
  ];

  for (const r of stats.rankings) {
    if (r.rank > 0) {
      const label = PERIOD_LABEL[r.period] ?? r.period;
      contextLines.push(
        `| ${label} | ${r.fundReturn.toFixed(2)}% | ${r.categoryAvg.toFixed(2)}% | ${r.rank}/${stats.totalInCategory} | 前 ${r.percentile}% |`
      );
    }
  }

  contextLines.push(
    "",
    "## 風險解讀",
    "| 指標 | 本基金 | 同類平均 | 解讀 |",
    "|------|--------|---------|------|",
    `| 年化標準差 | ${stats.riskComparison.fundStdDev.toFixed(2)}% | ${stats.riskComparison.categoryAvgStdDev.toFixed(2)}% | ${stats.riskComparison.interpretation} |`
  );

  return base + "\n" + contextLines.join("\n");
}
