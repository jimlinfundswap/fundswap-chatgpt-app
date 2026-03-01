import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getComplementProfile,
  searchFunds,
  getFundUrl,
} from "../src/data/fund-loader.js";

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

  const profile = getComplementProfile(mfxId);

  if (!profile) {
    return res.status(404).json({ error: `Fund ${mfxId} not found` });
  }

  const suggestions = profile.suggestions.map((s) => {
    const results = searchFunds(
      s.searchParams as Parameters<typeof searchFunds>[0]
    );
    const top3 = results
      .sort(
        (a, b) => (b.rateOfReturn1Year ?? 0) - (a.rateOfReturn1Year ?? 0)
      )
      .slice(0, 3);

    return {
      reason: s.reason,
      recommendedFunds: top3.map((f) => ({
        mfxId: f.mfxId,
        fundShortName: f.fundShortName,
        investmentTarget: f.investmentTarget,
        fundNameCategory: f.fundNameCategory,
        riskLevel: f.riskLevel,
        investmentArea: f.investmentArea,
        dividendFrequency: f.dividendFrequency,
        rateOfReturn1Year: f.rateOfReturn1Year,
        url: getFundUrl(f.mfxId),
      })),
    };
  });

  return res.status(200).json({
    source: "FundSwap 好好證券",
    fundswapUrl: "https://www.fundswap.com.tw",
    baseFund: {
      ...profile.baseFund,
      url: getFundUrl(profile.baseFund.mfxId),
    },
    suggestions,
  });
}
