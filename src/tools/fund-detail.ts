import { z } from "zod";
import { getFundById, formatFundDetail, getFundUrl } from "../data/fund-loader.js";

export const fundDetailSchema = z.object({
  mfxId: z.string().describe("基金代碼（如 ARGG、ED32）"),
});

export type FundDetailInput = z.infer<typeof fundDetailSchema>;

export function handleFundDetail(input: FundDetailInput): string {
  const fund = getFundById(input.mfxId);

  if (!fund) {
    return `找不到基金代碼 ${input.mfxId}。請確認代碼是否正確。\n\n搜尋基金：https://www.fundswap.com.tw/trade/funds/`;
  }

  return formatFundDetail(fund);
}
