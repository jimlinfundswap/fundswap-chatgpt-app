import { z } from "zod";
import { getFundById, formatFundDetail } from "../data/fund-loader.js";

export const fundDetailSchema = z.object({
  fund_id: z.string().describe("基金代碼（如 B01001）"),
});

export type FundDetailInput = z.infer<typeof fundDetailSchema>;

export function handleFundDetail(input: FundDetailInput): string {
  const fund = getFundById(input.fund_id);

  if (!fund) {
    return `找不到基金代碼 ${input.fund_id}。請確認代碼是否正確。\n\n搜尋基金：https://fundswap.com.tw/funds`;
  }

  return formatFundDetail(fund);
}
