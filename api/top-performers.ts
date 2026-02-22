import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getTopPerformers, getFundUrl } from "../src/data/fund-loader.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    investmentTarget,
    fundNameCategory,
    period = "1y",
    limit = "10",
  } = req.query;

  const periodStr = Array.isArray(period) ? period[0] : period;
  const limitNum = Math.min(Math.max(Number(limit) || 10, 1), 20);

  const results = getTopPerformers(
    {
      investmentTarget: asString(investmentTarget),
      fundNameCategory: asString(fundNameCategory),
    },
    periodStr,
    limitNum
  );

  return res.status(200).json({
    period: periodStr,
    total: results.length,
    funds: results.map((f, i) => ({
      rank: i + 1,
      mfxId: f.mfxId,
      fundShortName: f.fundShortName,
      investmentTarget: f.investmentTarget,
      fundNameCategory: f.fundNameCategory,
      riskLevel: f.riskLevel,
      generalIssuer: f.generalIssuer,
      dividendFrequency: f.dividendFrequency,
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
