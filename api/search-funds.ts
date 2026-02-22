import type { VercelRequest, VercelResponse } from "@vercel/node";
import { searchFunds, getFundUrl } from "../src/data/fund-loader.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    keyword,
    investmentTarget,
    riskLevel,
    investmentArea,
    fundNameCategory,
    dividendFrequency,
  } = req.query;

  const results = searchFunds({
    keyword: asString(keyword),
    investmentTarget: asString(investmentTarget),
    riskLevel: riskLevel ? Number(riskLevel) : undefined,
    investmentArea: asString(investmentArea),
    fundNameCategory: asString(fundNameCategory),
    dividendFrequency: asString(dividendFrequency),
  });

  const display = results.slice(0, 20);

  return res.status(200).json({
    total: results.length,
    showing: display.length,
    funds: display.map((f) => ({
      mfxId: f.mfxId,
      fundShortName: f.fundShortName,
      investmentTarget: f.investmentTarget,
      fundNameCategory: f.fundNameCategory,
      riskLevel: f.riskLevel,
      generalIssuer: f.generalIssuer,
      investmentArea: f.investmentArea,
      dividendFrequency: f.dividendFrequency,
      rateOfReturn1Year: f.rateOfReturn1Year,
      rateOfReturn3Years: f.rateOfReturn3Years,
      url: getFundUrl(f.mfxId),
    })),
  });
}

function asString(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
