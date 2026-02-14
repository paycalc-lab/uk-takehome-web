const hoursEl = document.getElementById('hours');
const rateEl  = document.getElementById('rate');
const outEl   = document.getElementById('out');

function money(n) {
  return (Number.isFinite(n) ? n : 0).toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP'
  });
}

function update() {
    const salary = parseFloat(salaryEl.value) || 0;
  const monthlyGross = salary / 12;
  salaryOutEl.textContent = `Monthly gross: ${money(monthlyGross)}`;

  const hours = parseFloat(hoursEl.value) || 0;
  const rate  = parseFloat(rateEl.value)  || 0;
  const gross = hours * rate;
  const takeHome = gross * 0.70;

  outEl.textContent = `Overtime gross: ${money(gross)} | Est. take-home (70%): ${money(takeHome)}`;
}

hoursEl.addEventListener('input', update);
rateEl.addEventListener('input', update);
salaryEl.addEventListener('input', update);
update();
