import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getTopPerformers, getFundUrl } from "../src/data/fund-loader.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    investmentTarget,
    fundNameCategory,
    dividendFrequency,
    investmentArea,
    maxRiskLevel,
    sortBy = "1y",
    period,
    limit = "10",
    returnFilterPeriod,
    returnFilterMin,
    returnFilterMax,
  } = req.query;

  // 向下相容：舊的 period 參數仍可用，但優先使用 sortBy
  const sortByStr = asString(sortBy) ?? asString(period) ?? "1y";
  const limitNum = Math.min(Math.max(Number(limit) || 10, 1), 20);

  const results = getTopPerformers(
    {
      investmentTarget: asString(investmentTarget),
      fundNameCategory: asString(fundNameCategory),
      dividendFrequency: asString(dividendFrequency),
      investmentArea: asString(investmentArea),
      maxRiskLevel: maxRiskLevel ? Number(maxRiskLevel) : undefined,
      returnFilterPeriod: asString(returnFilterPeriod),
      returnFilterMin: returnFilterMin ? Number(returnFilterMin) : undefined,
      returnFilterMax: returnFilterMax ? Number(returnFilterMax) : undefined,
    },
    sortByStr,
    limitNum
  );

  return res.status(200).json({
    sortBy: sortByStr,
    total: results.length,
    funds: results.map((f, i) => ({
      rank: i + 1,
      mfxId: f.mfxId,
      fundShortName: f.fundShortName,
      investmentTarget: f.investmentTarget,
      investmentArea: f.investmentArea,
      fundNameCategory: f.fundNameCategory,
      riskLevel: f.riskLevel,
      generalIssuer: f.generalIssuer,
      dividendFrequency: f.dividendFrequency,
      costPerformanceValue: f.costPerformanceValue,
      annualizedStandardDeviation: f.annualizedStandardDeviation,
      dividendAnnualizedYield: f.dividendAnnualizedYield,
      returns: {
        "3m": f.rateOfReturn3Months,
        "6m": f.rateOfReturn6Months,
        "1y": f.rateOfReturn1Year,
        "2y": f.rateOfReturn2Year,
        "3y": f.rateOfReturn3Years,
        "5y": f.rateOfReturn5Years,
      },
      url: getFundUrl(f.mfxId),
    })),
  });
}

function asString(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
