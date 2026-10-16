/**
 * Rooftop Solar Feasibility Calculator
 * Accurate tariff slabs for Domestic Urban, Domestic Rural, and Commercial
 * Sizing based on consumption and tariff slabs
 */

const TARIFF_DATA = {
  domestic_rural: {
    name: 'Domestic (Rural)',
    slabs: [
      { max: 102, rate: 5.00 },
      { max: 180, rate: 6.24 },
      { max: 300, rate: 6.89 },
      { max: 600, rate: 7.44 },
      { max: 900, rate: 7.61 },
      { max: Infinity, rate: 9.22 }
    ]
  },
  domestic_urban: {
    name: 'Domestic (Urban)',
    slabs: [
      { max: 102, rate: 5.04 },
      { max: 180, rate: 6.33 },
      { max: 300, rate: 7.12 },
      { max: 600, rate: 7.52 },
      { max: 900, rate: 7.69 },
      { max: Infinity, rate: 9.22 }
    ]
  },
  commercial: {
    name: 'Non-Domestic & Commercial',
    slabs: [
      { max: 180, rate: 5.77 },
      { max: 300, rate: 7.52 },
      { max: 450, rate: 8.20 },
      { max: 900, rate: 8.51 },
      { max: Infinity, rate: 9.02 }
    ]
  }
};

function formatINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Math.round(val));
}

// Compute bill amount for a given number of units using telescopic slabs
function computeBillFromUnits(units, category = 'domestic_rural') {
  if (units <= 0) return 0;
  const config = TARIFF_DATA[category] || TARIFF_DATA.domestic_rural;
  let bill = 0;
  let prev = 0;

  for (const slab of config.slabs) {
    if (units > slab.max) {
      bill += (slab.max - prev) * slab.rate;
      prev = slab.max;
    } else {
      bill += (units - prev) * slab.rate;
      break;
    }
  }
  return bill;
}

// Invert bill to units using binary search
function estimateUnitsFromBill(bill, category = 'domestic_rural') {
  if (bill <= 0) return 0;
  let low = 0;
  let high = Math.max(100, bill / 4);

  while (computeBillFromUnits(high, category) < bill) {
    high *= 2;
  }

  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2;
    const est = computeBillFromUnits(mid, category);
    if (est < bill) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

function calculateSolarPlan(monthlyBill, category = 'domestic_rural') {
  const monthlyUnits = estimateUnitsFromBill(monthlyBill, category);

  // System sizing per monthly consumption (approx 105 units generated per kW monthly)
  const unitsPerKWPerMonth = 105;
  
  let recommendedKW = monthlyUnits / unitsPerKWPerMonth;

  if (recommendedKW < 1) recommendedKW = 1;
  else if (recommendedKW > 25) recommendedKW = 25;
  else recommendedKW = Math.round(recommendedKW * 2) / 2; // round to nearest 0.5 kW

  // Estimated gross turnkey cost (approx ₹68,000 - ₹70,000 per kW)
  const grossCost = recommendedKW * 68000;

  // PM Surya Ghar Central Subsidy (applies to domestic connections)
  let subsidy = 0;
  if (category !== 'commercial') {
    if (recommendedKW >= 3) {
      subsidy = 78000;
    } else if (recommendedKW >= 2) {
      subsidy = 60000;
    } else if (recommendedKW >= 1) {
      subsidy = 30000;
    }
  }

  const netInvestment = Math.max(0, grossCost - subsidy);

  // Monthly generated units
  const monthlyGenUnits = recommendedKW * unitsPerKWPerMonth;

  // Net units remaining to be billed from WBSEDCL
  const remainingUnits = Math.max(0, monthlyUnits - monthlyGenUnits);
  const newMonthlyBill = computeBillFromUnits(remainingUnits, category);

  // Net monthly savings (or monthly solar generation value if current bill is 0)
  const potentialMonthlySavings = monthlyBill > 0
    ? Math.max(0, monthlyBill - newMonthlyBill)
    : Math.round(computeBillFromUnits(monthlyGenUnits, category));

  // 25-Year Lifetime Savings (300 months)
  const lifetimeSavings = potentialMonthlySavings * 300;

  // Payback period (years)
  const paybackYears = netInvestment > 0 && potentialMonthlySavings > 0
    ? (netInvestment / (potentialMonthlySavings * 12)).toFixed(1)
    : '5.8';

  // Area required: ~100 sq.ft per kW
  const roofAreaReq = Math.round(recommendedKW * 100);

  return {
    monthlyBill,
    category,
    monthlyUnits: Math.round(monthlyUnits),
    recommendedKW,
    grossCost,
    subsidy,
    netInvestment,
    monthlyGenUnits: Math.round(monthlyGenUnits),
    potentialMonthlySavings,
    newMonthlyBill,
    lifetimeSavings,
    paybackYears,
    roofAreaReq
  };
}

let currentCategory = 'domestic_rural';
let isPinVerified = false;

function getActiveCategory() {
  const select = document.getElementById('tariffCategory');
  if (select) return select.value;
  return currentCategory;
}

function updateCalculationDisplay(bill) {
  const category = getActiveCategory();
  const plan = calculateSolarPlan(bill, category);

  const setEl = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setEl('savingsAmount', formatINR(plan.lifetimeSavings));
  setEl('recommendedCapacity', `${plan.recommendedKW} kW`);
  setEl('monthlySavings', formatINR(plan.potentialMonthlySavings));
  setEl('subsidyAmount', formatINR(plan.subsidy));
  setEl('netInvestment', formatINR(plan.netInvestment));
  setEl('paybackPeriod', `~${plan.paybackYears} Years`);
  setEl('roofSpace', `~${plan.roofAreaReq} sq.ft`);
  setEl('monthlyGenUnits', `~${plan.monthlyGenUnits} Units`);
  setEl('consumedUnits', `~${plan.monthlyUnits} Units`);
}

// Verify West Bengal postal circle (PIN range 70xxxx - 74xxxx)
function isWestBengalPin(pin) {
  if (!/^[0-9]{6}$/.test(pin)) return false;
  const prefix = parseInt(pin.substring(0, 2), 10);
  return prefix >= 70 && prefix <= 74;
}

document.addEventListener('DOMContentLoaded', () => {
  const billSlider = document.getElementById('billSlider');
  const billValueDisplay = document.getElementById('billValueDisplay');
  const calcForm = document.getElementById('calcForm');
  const tariffCategory = document.getElementById('tariffCategory');
  const calcResult = document.getElementById('calcResult');
  const pincodeInput = document.getElementById('pincode');
  const pinError = document.getElementById('pinError');
  const pinServiceError = document.getElementById('pinServiceError');

  // Slider change
  if (billSlider && billValueDisplay) {
    billSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      billValueDisplay.textContent = formatINR(val) + (val >= 25000 ? '+' : '');
      if (isPinVerified) {
        updateCalculationDisplay(val);
      }
    });
  }

  // Category change
  if (tariffCategory) {
    tariffCategory.addEventListener('change', () => {
      currentCategory = tariffCategory.value;
      if (isPinVerified) {
        const bill = parseInt(billSlider ? billSlider.value : 3000);
        updateCalculationDisplay(bill);
      }
    });
  }

  // Pincode input reset on typing
  if (pincodeInput) {
    pincodeInput.addEventListener('input', () => {
      isPinVerified = false;
      if (pinError) pinError.classList.add('hidden');
      if (pinServiceError) pinServiceError.classList.add('hidden');
      if (calcResult) calcResult.classList.add('hidden');
      const calcPrompt = document.getElementById('calcPrompt');
      if (calcPrompt) calcPrompt.classList.remove('hidden');
    });
  }

  // Form submit: MUST qualify PIN first
  if (calcForm) {
    calcForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pin = pincodeInput ? pincodeInput.value.trim() : '';
      const calcPrompt = document.getElementById('calcPrompt');

      // 1. Check valid 6 digits format
      if (!/^[0-9]{6}$/.test(pin)) {
        isPinVerified = false;
        if (pinError) pinError.classList.remove('hidden');
        if (pinServiceError) pinServiceError.classList.add('hidden');
        if (calcResult) calcResult.classList.add('hidden');
        if (calcPrompt) calcPrompt.classList.remove('hidden');
        if (pincodeInput) pincodeInput.focus();
        return;
      } else {
        if (pinError) pinError.classList.add('hidden');
      }

      // 2. Check West Bengal service area
      if (!isWestBengalPin(pin)) {
        isPinVerified = false;
        if (pinServiceError) pinServiceError.classList.remove('hidden');
        if (calcResult) calcResult.classList.add('hidden');
        if (calcPrompt) calcPrompt.classList.remove('hidden');
        if (window.showToast) {
          window.showToast('This PIN code is out of our service area. We currently serve West Bengal only.', true);
        }
        if (pincodeInput) pincodeInput.focus();
        return;
      } else {
        if (pinServiceError) pinServiceError.classList.add('hidden');
      }

      // 3. PIN Qualified! Now calculate and reveal results
      isPinVerified = true;
      const bill = parseInt(billSlider ? billSlider.value : 3000);
      updateCalculationDisplay(bill);

      if (calcPrompt) {
        calcPrompt.classList.add('hidden');
      }
      if (calcResult) {
        calcResult.classList.remove('hidden');
        calcResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      if (window.showToast) {
        window.showToast('PIN verified! Rooftop solar estimation calculated.');
      }
    });
  }
});
