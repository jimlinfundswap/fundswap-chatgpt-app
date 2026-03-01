import type { VercelRequest, VercelResponse } from "@vercel/node";
import { searchByHolding, getFundUrl } from "../src/data/fund-loader.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stockName = asString(req.query.stockName);
  if (!stockName) {
    return res.status(400).json({ error: "stockName is required" });
  }

  const investmentTarget = asString(req.query.investmentTarget);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 20);

  const { matches: results, total } = searchByHolding({ stockName, investmentTarget, limit });

  return res.status(200).json({
    source: "FundSwap 好好證券",
    fundswapUrl: "https://www.fundswap.com.tw",
    query: stockName,
    total,
    showing: results.length,
    funds: results.map((r) => ({
      mfxId: r.fund.mfxId,
      fundShortName: r.fund.fundShortName,
      investmentTarget: r.fund.investmentTarget,
      fundNameCategory: r.fund.fundNameCategory,
      riskLevel: r.fund.riskLevel,
      generalIssuer: r.fund.generalIssuer,
      investmentArea: r.fund.investmentArea,
      dividendFrequency: r.fund.dividendFrequency,
      rateOfReturn1Year: r.fund.rateOfReturn1Year,
      matchedHoldings: r.matchedHoldings.map((h) => ({
        stockName: h.stock_name,
        holdingRatio: h.holding_ratio,
      })),
      totalMatchedRatio: r.totalMatchedRatio,
      url: getFundUrl(r.fund.mfxId),
    })),
  });
}

function asString(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
