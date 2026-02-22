const fs = require("fs");
const path = require("path");

const inputPath = path.resolve(__dirname, "../data/funds-sample.json");
const outputPath = path.resolve(__dirname, "../data/funds.json");

const raw = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

const slim = raw.map((f) => ({
  mfxId: f.mfxId,
  fundShortName: f.fundShortName,
  generalIssuer: f.generalIssuer,
  fundNameCategory: f.fundNameCategory,
  investmentArea: f.investmentArea,
  investmentTarget: f.investmentTarget,
  riskLevel: f.riskLevel,
  dividendFrequency: f.dividendFrequency,
  annualizedStandardDeviation: f.annualizedStandardDeviation,
  costPerformanceValue: f.costPerformanceValue,
  dividendAnnualizedYield: f.dividendAnnualizedYield,
  dividendAnnualRateOfReturn: f.dividendAnnualRateOfReturn,
  rateOfReturn3Months: f.rateOfReturn3Months,
  rateOfReturn6Months: f.rateOfReturn6Months,
  rateOfReturn1Year: f.rateOfReturn1Year,
  rateOfReturn2Year: f.rateOfReturn2Year,
  rateOfReturn3Years: f.rateOfReturn3Years,
  rateOfReturn5Years: f.rateOfReturn5Years,
  tradingType: f.tradingType,
  stockTop: Array.isArray(f.stockTop)
    ? f.stockTop.map((s) => ({
        stock_name: s.stock_name,
        holding_ratio: s.holding_ratio,
      }))
    : [],
}));

fs.writeFileSync(outputPath, JSON.stringify(slim));

const origSize = fs.statSync(inputPath).size;
const newSize = fs.statSync(outputPath).size;
console.log(`Original: ${(origSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`Slimmed:  ${(newSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`Reduced:  ${(((origSize - newSize) / origSize) * 100).toFixed(1)}%`);
console.log(`Funds:    ${slim.length}`);
