import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getFundById, getFundUrl } from "../src/data/fund-loader.js";

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

  return res.status(200).json({
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
    url: getFundUrl(fund.mfxId),
  });
}
