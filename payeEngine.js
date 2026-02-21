// payeEngine.js
// UK PAYE Engine 2025/26
// Deterministic. No recursion. No self-calling loops.

export function calcNet({
  taxYear,
  region,
  salaryAnnual,
  pensionPct,
  overtimeAnnual
}) {

  const grossAnnual = salaryAnnual + overtimeAnnual;

  const pensionAnnual = salaryAnnual * (pensionPct / 100);

  const taxableIncome = grossAnnual - pensionAnnual;

  const personalAllowance = calculatePersonalAllowance(taxableIncome);

  const incomeTax = calculateIncomeTax(region, taxableIncome, personalAllowance);

  const nationalInsurance = calculateNI(taxableIncome);

  const totalTaxAnnual = incomeTax + nationalInsurance;

  const netAnnual = grossAnnual - pensionAnnual - totalTaxAnnual;

  const netMonthly = netAnnual / 12;
  const netWeekly = netAnnual / 52;

  // Overtime delta = difference between with and without overtime
  const baseResult = calculateBaseSalaryOnly({
    region,
    salaryAnnual,
    pensionPct
  });

  const overtimeNetImpactMonthly =
    (netAnnual - baseResult.netAnnual) / 12;

  return {
    netAnnual,
    netMonthly,
    netWeekly,
    pensionAnnual,
    totalTaxAnnual,
    overtimeNetImpactMonthly
  };
}

// -------- Base salary calculation (NO overtime) --------

function calculateBaseSalaryOnly({
  region,
  salaryAnnual,
  pensionPct
}) {
  const pensionAnnual = salaryAnnual * (pensionPct / 100);
  const taxableIncome = salaryAnnual - pensionAnnual;
  const personalAllowance = calculatePersonalAllowance(taxableIncome);
  const incomeTax = calculateIncomeTax(region, taxableIncome, personalAllowance);
  const nationalInsurance = calculateNI(taxableIncome);
  const totalTaxAnnual = incomeTax + nationalInsurance;
  const netAnnual = salaryAnnual - pensionAnnual - totalTaxAnnual;

  return { netAnnual };
}

// -------- Personal Allowance --------

function calculatePersonalAllowance(income) {
  const base = 12570;

  if (income <= 100000) return base;
  if (income >= 125140) return 0;

  const reduction = (income - 100000) / 2;
  return base - reduction;
}

// -------- Income Tax --------

function calculateIncomeTax(region, income, allowance) {

  const taxable = Math.max(0, income - allowance);

  if (region === "scotland") {
    return calculateScottishTax(taxable);
  }

  return calculateRUKTax(taxable);
}

function calculateRUKTax(taxable) {

  let tax = 0;

  const basicLimit = 37700;
  const higherLimit = 125140 - 12570;

  if (taxable <= basicLimit) {
    tax += taxable * 0.20;
  } else {
    tax += basicLimit * 0.20;

    if (taxable <= higherLimit) {
      tax += (taxable - basicLimit) * 0.40;
    } else {
      tax += (higherLimit - basicLimit) * 0.40;
      tax += (taxable - higherLimit) * 0.45;
    }
  }

  return tax;
}

function calculateScottishTax(taxable) {

  let tax = 0;

  const bands = [
    { limit: 2562, rate: 0.19 },
    { limit: 14662, rate: 0.20 },
    { limit: 25688, rate: 0.21 },
    { limit: 43662, rate: 0.42 },
    { limit: 125140 - 12570, rate: 0.45 }
  ];

  let remaining = taxable;
  let previousLimit = 0;

  for (const band of bands) {
    if (remaining <= 0) break;

    const bandWidth = band.limit - previousLimit;
    const taxableInBand = Math.min(remaining, bandWidth);

    tax += taxableInBand * band.rate;

    remaining -= taxableInBand;
    previousLimit = band.limit;
  }

  if (remaining > 0) {
    tax += remaining * 0.48;
  }

  return tax;
}

// -------- National Insurance --------

function calculateNI(income) {

  const lowerThreshold = 12570;
  const upperThreshold = 50270;

  if (income <= lowerThreshold) return 0;

  let ni = 0;

  if (income <= upperThreshold) {
    ni += (income - lowerThreshold) * 0.08;
  } else {
    ni += (upperThreshold - lowerThreshold) * 0.08;
    ni += (income - upperThreshold) * 0.02;
  }

  return ni;
}
