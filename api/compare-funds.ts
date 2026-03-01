import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getFundById, getFundUrl } from "../src/data/fund-loader.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { mfx_ids } = req.body as { mfx_ids?: string[] };

  if (!Array.isArray(mfx_ids) || mfx_ids.length < 2 || mfx_ids.length > 5) {
    return res
      .status(400)
      .json({ error: "mfx_ids must be an array of 2-5 fund IDs" });
  }

  const funds = [];
  const notFound: string[] = [];

  for (const id of mfx_ids) {
    const fund = getFundById(id);
    if (fund) {
      funds.push(fund);
    } else {
      notFound.push(id);
    }
  }

  if (funds.length < 2) {
    return res.status(400).json({
      error: "At least 2 valid funds required for comparison",
      notFound,
    });
  }

  return res.status(200).json({
    source: "FundSwap 好好證券",
    fundswapUrl: "https://www.fundswap.com.tw",
    notFound: notFound.length > 0 ? notFound : undefined,
    funds: funds.map((f) => ({
      mfxId: f.mfxId,
      fundShortName: f.fundShortName,
      investmentTarget: f.investmentTarget,
      fundNameCategory: f.fundNameCategory,
      riskLevel: f.riskLevel,
      generalIssuer: f.generalIssuer,
      investmentArea: f.investmentArea,
      dividendFrequency: f.dividendFrequency,
      costPerformanceValue: f.costPerformanceValue,
      returns: {
        "3m": f.rateOfReturn3Months,
        "6m": f.rateOfReturn6Months,
        "1y": f.rateOfReturn1Year,
        "2y": f.rateOfReturn2Year,
        "3y": f.rateOfReturn3Years,
        "5y": f.rateOfReturn5Years,
      },
      annualizedStandardDeviation: f.annualizedStandardDeviation,
      url: getFundUrl(f.mfxId),
    })),
  });
}
