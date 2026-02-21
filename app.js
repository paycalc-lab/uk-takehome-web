// app.js
// UK Pay Clarity — Free (frozen) + Premium Compare Scaffold (not active yet)
// Rules:
// - Single DOMContentLoaded
// - Single calc engine (calcNet) used for both scenarios
// - Premium UI rendered into #premium-root
// - Premium is OFF by default (no behaviour change)

import { calcNet } from "./payeEngine.js";

document.addEventListener("DOMContentLoaded", () => {

  // ---------------- Free wiring (unchanged) ----------------

  const form = document.getElementById("calcForm");

  const salaryInput = document.getElementById("salaryAnnual");
  const pensionInput = document.getElementById("pensionPct");
  const regionInput = document.getElementById("region");

  const overtimeMonthlyInput = document.getElementById("overtimeMonthly");

  const netMonthlyEl = document.getElementById("netMonthly");
  const netWeeklyEl = document.getElementById("netWeekly");
  const breakdownEl = document.getElementById("breakdown");

  function computeFree() {
    const salaryAnnual = toNumber(salaryInput?.value);
    const pensionPct = toNumber(pensionInput?.value);
    const region = regionInput?.value || "rUK";
    const overtimeMonthly = toNumber(overtimeMonthlyInput?.value);
    const overtimeAnnual = overtimeMonthly * 12;

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
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    computeFree();
  });

  [salaryInput, pensionInput, regionInput, overtimeMonthlyInput]
    .filter(Boolean)
    .forEach((el) => {
      el.addEventListener("input", computeFree);
      el.addEventListener("change", computeFree);
    });

  computeFree();

  // ---------------- Premium scaffold (OFF) ----------------

  const premiumRoot = document.getElementById("premium-root");
  if (!premiumRoot) return;

  premiumRoot.setAttribute("data-premium", "false");
  premiumRoot.style.display = "none";

  // Render scaffold so structure exists (still hidden)
  premiumRoot.innerHTML = `
    <section class="card premiumCard">
      <div class="cardTitle">Premium compare (locked)</div>
      <p class="hint">Premium is not active in this build.</p>
    </section>
  `;

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
