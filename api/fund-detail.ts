import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getFundById, getFundUrl, getCategoryStats } from "../src/data/fund-loader.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const mfxId = Array.isArray(req.query.mfxId)
    ? req.query.mfxId[0]
    : req.query.mfxId;

  if (!mfxId) {
    return res.status(400).json({ error: "mfxId is required" });
  }

  const fund = getFundById(mfxId);

  if (!fund) {
    return res.status(404).json({ error: `Fund ${mfxId} not found` });
  }

  const stats = getCategoryStats(fund);

  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  return res.status(200).json({
    source: "FundSwap 好好證券",
    fundswapUrl: "https://www.fundswap.com.tw",
    mfxId: fund.mfxId,
    fundShortName: fund.fundShortName,
    investmentTarget: fund.investmentTarget,
    fundNameCategory: fund.fundNameCategory,
    riskLevel: fund.riskLevel,
    generalIssuer: fund.generalIssuer,
    investmentArea: fund.investmentArea,
    dividendFrequency: fund.dividendFrequency,
    costPerformanceValue: fund.costPerformanceValue,
    dividendAnnualizedYield: fund.dividendAnnualizedYield,
    dividendAnnualRateOfReturn: fund.dividendAnnualRateOfReturn,
    returns: {
      "3m": fund.rateOfReturn3Months,
      "6m": fund.rateOfReturn6Months,
      "1y": fund.rateOfReturn1Year,
      "2y": fund.rateOfReturn2Year,
      "3y": fund.rateOfReturn3Years,
      "5y": fund.rateOfReturn5Years,
    },
    annualizedStandardDeviation: fund.annualizedStandardDeviation,
    stockTop: fund.stockTop.map((s) => ({
      stockName: s.stock_name,
      holdingRatio: s.holding_ratio,
    })),
    categoryContext: {
      category: stats.category,
      totalInCategory: stats.totalInCategory,
      rankings: stats.rankings
        .filter((r) => r.rank > 0)
        .map((r) => ({
          period: r.period,
          rank: r.rank,
          percentile: r.percentile,
          categoryAvg: Number(r.categoryAvg.toFixed(2)),
          fundReturn: Number(r.fundReturn.toFixed(2)),
        })),
      riskComparison: {
        categoryAvgStdDev: Number(
          stats.riskComparison.categoryAvgStdDev.toFixed(2)
        ),
        fundStdDev: Number(stats.riskComparison.fundStdDev.toFixed(2)),
        interpretation: stats.riskComparison.interpretation,
      },
    },
    url: getFundUrl(fund.mfxId),
  });
}
