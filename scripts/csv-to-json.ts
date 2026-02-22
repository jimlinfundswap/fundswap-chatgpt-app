/**
 * CSV → JSON 轉換腳本
 *
 * 用法：npm run convert-csv
 *
 * 將 data/funds.csv 轉換為 data/funds-sample.json
 * CSV 必須包含以下欄位（第一行為 header）：
 *   fund_id, name_zh, name_en, type, company, manager, inception_date,
 *   fund_size_billion, management_fee_pct, custody_fee_pct, region,
 *   investment_target, risk_level, nav, nav_date, return_1m_pct,
 *   return_3m_pct, return_6m_pct, return_1y_pct, return_3y_pct,
 *   return_5y_pct, return_ytd_pct, sharpe_ratio, std_dev_pct,
 *   max_drawdown_pct, url
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = resolve(__dirname, "../data/funds.csv");
const jsonPath = resolve(__dirname, "../data/funds-sample.json");

const NUMERIC_FIELDS = new Set([
  "fund_size_billion",
  "management_fee_pct",
  "custody_fee_pct",
  "nav",
  "return_1m_pct",
  "return_3m_pct",
  "return_6m_pct",
  "return_1y_pct",
  "return_3y_pct",
  "return_5y_pct",
  "return_ytd_pct",
  "sharpe_ratio",
  "std_dev_pct",
  "max_drawdown_pct",
]);

function parseCsv(content: string): Record<string, string | number>[] {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const record: Record<string, string | number> = {};

    headers.forEach((header, i) => {
      const value = values[i] ?? "";
      if (NUMERIC_FIELDS.has(header) && value !== "") {
        record[header] = parseFloat(value);
      } else {
        record[header] = value;
      }
    });

    // Auto-generate URL if missing
    if (!record.url && record.fund_id) {
      record.url = `https://fundswap.com.tw/fund/${record.fund_id}`;
    }

    return record;
  });
}

try {
  const csv = readFileSync(csvPath, "utf-8");
  const funds = parseCsv(csv);
  writeFileSync(jsonPath, JSON.stringify(funds, null, 2), "utf-8");
  console.log(`Converted ${funds.length} funds from CSV to JSON`);
  console.log(`Output: ${jsonPath}`);
} catch (err) {
  if ((err as NodeJS.ErrnoException).code === "ENOENT") {
    console.error(`CSV file not found: ${csvPath}`);
    console.error("Please place your fund data CSV at data/funds.csv");
  } else {
    throw err;
  }
}
