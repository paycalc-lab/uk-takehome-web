// app.js
// UK Pay Clarity — Stable wiring (supports monthly OR annual overtime input)
// - Works with #overtimeMonthly (monthly UI) OR #overtimeAnnual (older annual UI)
// - Recalculates on submit AND on input changes
// - Engine untouched

import { calcNet } from "./payeEngine.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("calcForm");

  const salaryInput = document.getElementById("salaryAnnual");
  const pensionInput = document.getElementById("pensionPct");
  const regionInput = document.getElementById("region");

  // Overtime (support both IDs)
  const overtimeMonthlyInput = document.getElementById("overtimeMonthly");
  const overtimeAnnualInput = document.getElementById("overtimeAnnual");

  const netMonthlyEl = document.getElementById("netMonthly");
  const netWeeklyEl = document.getElementById("netWeekly");
  const breakdownEl = document.getElementById("breakdown");

  // Premium root (inactive for now)
  const premiumRoot = document.getElementById("premium-root");
  if (premiumRoot) premiumRoot.setAttribute("data-premium", "false");

  function compute() {
    try {
      const salaryAnnual = toNumber(salaryInput?.value);
      const pensionPct = toNumber(pensionInput?.value);
      const region = regionInput?.value || "rUK";

      // Prefer monthly input if present; otherwise fall back to annual input.
      let overtimeAnnual = 0;

      if (overtimeMonthlyInput) {
        const overtimeMonthly = toNumber(overtimeMonthlyInput.value);
        overtimeAnnual = overtimeMonthly * 12;
      } else if (overtimeAnnualInput) {
        overtimeAnnual = toNumber(overtimeAnnualInput.value);
      }

      const result = calcNet({
        taxYear: "2025/26",
        region,
        salaryAnnual,
        pensionPct,
        overtimeAnnual
      });

      netMonthlyEl.textContent = formatCurrency(result.netMonthly);
      netWeeklyEl.textContent = formatCurrency(result.netWeekly);

      breakdownEl.innerHTML = `
        <div><span>You keep each year</span><span>${formatCurrency(result.netAnnual)}</span></div>
        <div><span>You invest into pension (per year)</span><span>${formatCurrency(result.pensionAnnual)}</span></div>
        <div><span>Goes to tax and NI (per year)</span><span>${formatCurrency(result.totalTaxAnnual)}</span></div>
        <div><span>Overtime changes your monthly take-home by</span><span>${formatCurrency(result.overtimeNetImpactMonthly)}</span></div>
      `;
    } catch (err) {
      // If anything goes wrong, show a clear failure state (no silent broken UI)
      netMonthlyEl.textContent = "—";
      netWeeklyEl.textContent = "—";
      breakdownEl.innerHTML = `<div><span>Something went wrong</span><span>Check inputs</span></div>`;
      console.error("Compute error:", err);
    }
  }

  // Submit (button)
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    compute();
  });

  // Live recalculation (so it always feels responsive)
  [salaryInput, pensionInput, regionInput, overtimeMonthlyInput, overtimeAnnualInput]
    .filter(Boolean)
    .forEach((el) => {
      el.addEventListener("input", compute);
      el.addEventListener("change", compute);
    });

  // Initial calculation
  compute();
});

function toNumber(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2
  }).format(value);
}
