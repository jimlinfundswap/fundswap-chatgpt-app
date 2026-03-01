import type { VercelRequest, VercelResponse } from "@vercel/node";
import { analyzeHoldingsOverlap, getFundUrl } from "../src/data/fund-loader.js";

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

  const result = analyzeHoldingsOverlap(mfx_ids);

  if (!result || result.funds.length < 2) {
    return res.status(400).json({
      error: "At least 2 valid funds required for overlap analysis",
    });
  }

  return res.status(200).json({
    source: "FundSwap 好好證券",
    fundswapUrl: "https://www.fundswap.com.tw",
    funds: result.funds.map((f) => ({
      ...f,
      url: getFundUrl(f.mfxId),
    })),
    overlapRatio: result.overlapRatio,
    concentrationWarning: result.concentrationWarning,
    sharedHoldings: result.sharedHoldings.map((s) => ({
      stockName: s.stockName,
      heldByCount: s.funds.length,
      avgHoldingRatio: Number(s.avgHoldingRatio.toFixed(4)),
      details: s.funds.map((f) => ({
        mfxId: f.mfxId,
        holdingRatio: f.holdingRatio,
      })),
    })),
  });
}
