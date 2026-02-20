// app.js
// PAYE Calc Lab – V1 UI Wiring (plain language, orientation-first)
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

    // Plain English labels (no jargon)
    breakdownEl.innerHTML = `
      <div><span>You keep each year</span><span>${formatCurrency(result.netAnnual)}</span></div>
      <div><span>You invest into pension (per year)</span><span>${formatCurrency(result.pensionAnnual)}</span></div>
      <div><span>Goes to tax and NI (per year)</span><span>${formatCurrency(result.totalTaxAnnual)}</span></div>
      <div><span>Overtime changes your monthly take-home by</span><span>${formatCurrency(result.overtimeNetImpactMonthly)}</span></div>
    `;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    compute();
  });

  // Optional: show results immediately with the default values
  compute();
});

function formatCurrency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value);
}
