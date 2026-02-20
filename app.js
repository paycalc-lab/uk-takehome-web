// app.js
// PAYE Calc Lab – V1 UI Wiring
// Single DOMContentLoaded
// Single compute trigger
// No duplicated logic

import { calcNet } from "./payeEngine.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("calcForm");

  const salaryInput = document.getElementById("salaryAnnual");
  const pensionInput = document.getElementById("pensionPct");
  const regionInput = document.getElementById("region");
  const overtimeInput = document.getElementById("overtimeAnnual");

  const netMonthlyEl = document.getElementById("netMonthly");
  const netWeeklyEl = document.getElementById("netWeekly");
  const breakdownEl = document.getElementById("breakdown");

  function compute() {
    const salaryAnnual = parseFloat(salaryInput.value) || 0;
    const pensionPct = parseFloat(pensionInput.value) || 0;
    const region = regionInput.value || "rUK";
    const overtimeAnnual = parseFloat(overtimeInput.value) || 0;

    const result = calcNet({
      taxYear: "2025/26",
      region,
      salaryAnnual,
      pensionPct,
      overtimeAnnual,
    });

    netMonthlyEl.textContent = formatCurrency(result.netMonthly);
    netWeeklyEl.textContent = formatCurrency(result.netWeekly);

    breakdownEl.innerHTML = `
      <div>Net Annual: ${formatCurrency(result.netAnnual)}</div>
      <div>Pension Annual: ${formatCurrency(result.pensionAnnual)}</div>
      <div>Total Tax Annual: ${formatCurrency(result.totalTaxAnnual)}</div>
      <div>Overtime Net Impact (Monthly): ${formatCurrency(result.overtimeNetImpactMonthly)}</div>
    `;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    compute();
  });
});

function formatCurrency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value);
}
