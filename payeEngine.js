/* payeEngine.js
   UK PAYE Net Pay Engine — Tax Year 2025/26 (V1)
   - Regions: rUK (England/Wales/NI) and Scotland
   - Pension: salary sacrifice on base salary only (overtime excluded in V1)
   - Overtime: annualised, taxed/NI at marginal rates
   - Student loan: not included (V1)

   Sources:
   - Personal Allowance & rUK bands: GOV.UK Income Tax rates (2025/26). https://www.gov.uk/income-tax-rates
   - NI rates (Class 1 employees): GOV.UK NIC rates and allowances (2025/26). https://www.gov.uk/government/publications/rates-and-allowances-national-insurance-contributions/rates-and-allowances-national-insurance-contributions
   - Scotland bands: GOV.UK employer thresholds / Scottish rates (2025/26). https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2025-to-2026
*/

export function calcNet({
  taxYear = "2025/26",
  region = "rUK", // "rUK" | "scotland"
  salaryAnnual = 0,
  pensionPct = 5, // percent (e.g. 5)
  overtimeAnnual = 0,
} = {}) {
  // --------- validate & normalise ----------
  const s = toNumber(salaryAnnual);
  const o = toNumber(overtimeAnnual);
  const pPct = clamp(toNumber(pensionPct), 0, 100) / 100;

  // V1 rule: pension is salary sacrifice on BASE salary only (overtime excluded)
  const pensionAnnual = round2(s * pPct);

  // Earnings used for Income Tax (salary sacrifice reduces taxable earnings)
  const taxableEarningsAnnual = Math.max(0, (s - pensionAnnual) + o);

  // Earnings used for NI (salary sacrifice reduces NIable earnings on base salary; overtime not sacrificed)
  const niEarningsAnnual = Math.max(0, (s - pensionAnnual) + o);

  // --------- personal allowance (PA) with 100k taper ----------
  const PA_STANDARD = 12570;
  const ANI = taxableEarningsAnnual; // Adjusted Net Income proxy for V1: taxable earnings after salary sacrifice
  let personalAllowance = PA_STANDARD;

  if (ANI > 100000) {
    const reduction = (ANI - 100000) / 2;
    personalAllowance = Math.max(0, PA_STANDARD - reduction);
  }
  // Fully removed by ~125,140; the formula above achieves that.
  personalAllowance = Math.floor(personalAllowance); // keep it clean/deterministic

  const taxableAfterPA = Math.max(0, taxableEarningsAnnual - personalAllowance);

  // --------- Income Tax ----------
  const incomeTaxAnnual =
    region === "scotland"
      ? calcScottishIncomeTax2025_26(taxableAfterPA)
      : calcRUKIncomeTax2025_26(taxableAfterPA);

  // --------- National Insurance (employee Class 1 primary) ----------
  const niAnnual = calcNIClass1Primary2025_26(niEarningsAnnual);

  // --------- Net ----------
  const netAnnual = Math.max(0, taxableEarningsAnnual - incomeTaxAnnual - niAnnual);

  // Overtime net impact (monthly): compute delta vs zero overtime
  const delta = calcOvertimeDeltaMonthly({
    region,
    salaryAnnual: s,
    pensionPct: pPct * 100,
    overtimeAnnual: o,
  });

  return {
    taxYear,
    region,
    salaryAnnual: round2(s),
    overtimeAnnual: round2(o),
    pensionPct: round2(pPct * 100),
    pensionAnnual: round2(pensionAnnual),

    personalAllowance: round2(personalAllowance),
    taxableEarningsAnnual: round2(taxableEarningsAnnual),
    taxableAfterPA: round2(taxableAfterPA),

    incomeTaxAnnual: round2(incomeTaxAnnual),
    niAnnual: round2(niAnnual),
    totalTaxAnnual: round2(incomeTaxAnnual + niAnnual),

    netAnnual: round2(netAnnual),
    netMonthly: round2(netAnnual / 12),
    netWeekly: round2(netAnnual / 52),

    overtimeNetImpactMonthly: round2(delta),
  };
}

/* -------------------- TAX FUNCTIONS -------------------- */

function calcRUKIncomeTax2025_26(taxableAfterPA) {
  // rUK (England/Wales/NI) bands on taxable income AFTER PA:
  // 20% up to 50,270; 40% 50,271 to 125,140; 45% above 125,140
  const BASIC_LIMIT = 50270;
  const HIGHER_LIMIT = 125140;

  const t = taxableAfterPA;

  const basic = Math.min(t, BASIC_LIMIT);
  const higher = Math.min(Math.max(0, t - BASIC_LIMIT), HIGHER_LIMIT - BASIC_LIMIT);
  const additional = Math.max(0, t - HIGHER_LIMIT);

  return basic * 0.20 + higher * 0.40 + additional * 0.45;
}

function calcScottishIncomeTax2025_26(taxableAfterPA) {
  // Scotland bands are expressed as "annual earnings above PAYE threshold" (i.e., after PA).
  // Rates/thresholds (2025/26):
  // 19%: Up to 2,827
  // 20%: 2,828 to 14,921
  // 21%: 14,922 to 31,092
  // 42%: 31,093 to 62,430
  // 45%: 62,431 to 125,140
  // 48%: above 125,140

  const bands = [
    { upTo: 2827, rate: 0.19 },
    { upTo: 14921, rate: 0.20 },
    { upTo: 31092, rate: 0.21 },
    { upTo: 62430, rate: 0.42 },
    { upTo: 125140, rate: 0.45 },
    { upTo: Infinity, rate: 0.48 },
  ];

  return applyBands(taxableAfterPA, bands);
}

function calcNIClass1Primary2025_26(niEarningsAnnual) {
  // Employee Class 1 primary:
  // 0% up to Primary Threshold (annualised from £242/week / £1,048/month): £12,570
  // 8% between PT and Upper Earnings Limit (annualised from £967/week / £4,189/month): £50,270
  // 2% above UEL
  const PT = 12570;
  const UEL = 50270;

  const e = niEarningsAnnual;

  const mainBand = Math.min(Math.max(0, e - PT), UEL - PT);
  const upperBand = Math.max(0, e - UEL);

  return mainBand * 0.08 + upperBand * 0.02;
}

/* -------------------- OVERTIME DELTA -------------------- */

function calcOvertimeDeltaMonthly({ region, salaryAnnual, pensionPct, overtimeAnnual }) {
  if (toNumber(overtimeAnnual) <= 0) return 0;

  const withOT = calcNet({
    region,
    salaryAnnual,
    pensionPct,
    overtimeAnnual,
  });

  const withoutOT = calcNet({
    region,
    salaryAnnual,
    pensionPct,
    overtimeAnnual: 0,
  });

  return (withOT.netAnnual - withoutOT.netAnnual) / 12;
}

/* -------------------- BAND HELPER -------------------- */

function applyBands(amount, bands) {
  let remaining = amount;
  let tax = 0;
  let lastCap = 0;

  for (const b of bands) {
    const cap = b.upTo;
    const bandSize = (cap === Infinity) ? remaining : Math.max(0, Math.min(remaining, cap - lastCap));
    tax += bandSize * b.rate;
    remaining -= bandSize;
    lastCap = cap;
    if (remaining <= 0) break;
  }

  return tax;
}

/* -------------------- UTIL -------------------- */

function toNumber(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
