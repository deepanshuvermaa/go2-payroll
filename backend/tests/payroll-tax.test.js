/**
 * Payroll & Tax Calculation Tests
 * Run: node tests/payroll-tax.test.js
 */

// Indian Tax Slabs FY 2024-25
const NEW_REGIME_SLABS = [
  { from: 0, to: 300000, rate: 0 },
  { from: 300001, to: 700000, rate: 0.05 },
  { from: 700001, to: 1000000, rate: 0.10 },
  { from: 1000001, to: 1200000, rate: 0.15 },
  { from: 1200001, to: 1500000, rate: 0.20 },
  { from: 1500001, to: Infinity, rate: 0.30 },
];

function calculateNewRegimeTax(taxableIncome) {
  let tax = 0;
  for (const slab of NEW_REGIME_SLABS) {
    if (taxableIncome <= slab.from) break;
    const applicable = Math.min(taxableIncome, slab.to) - slab.from + (slab.from === 0 ? 0 : 1);
    tax += Math.max(0, applicable) * slab.rate;
  }
  // Rebate u/s 87A
  if (taxableIncome <= 700000) tax = 0;
  const cess = tax * 0.04;
  return { tax: Math.round(tax), cess: Math.round(cess), total: Math.round(tax + cess) };
}

function calculatePF(basic) {
  const ceiling = 15000;
  const base = Math.min(basic, ceiling);
  return { employee: Math.round(base * 0.12), employer: Math.round(base * 0.12) };
}

function calculateESI(gross) {
  if (gross > 21000) return { employee: 0, employer: 0, applicable: false };
  return { employee: Math.round(gross * 0.0075), employer: Math.round(gross * 0.0325), applicable: true };
}

function calculatePT(gross) {
  if (gross <= 7500) return 0;
  if (gross <= 10000) return 175;
  return 200;
}

// ===== TESTS =====
let passed = 0, failed = 0;
function assert(condition, name) {
  if (condition) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}`); }
}

console.log('\n=== TAX CALCULATION TESTS ===\n');

// Test 1: Income ≤ 7L → 0 tax (new regime rebate)
let r = calculateNewRegimeTax(700000 - 75000); // After standard deduction
assert(r.total === 0, 'Income 7L (new regime) → ₹0 tax (rebate 87A)');

// Test 2: Income 10L new regime
r = calculateNewRegimeTax(1000000 - 75000); // 9,25,000 taxable
assert(r.tax > 0, 'Income 10L → tax > 0');
// 0-3L: 0, 3-7L: 20000, 7-9.25L: 22500 = 42500
assert(r.tax === 42500, `Income 10L tax = ₹42,500 (got ${r.tax})`);

// Test 3: Income 15L new regime
r = calculateNewRegimeTax(1500000 - 75000); // 14,25,000
// 0-3L: 0, 3-7L: 20000, 7-10L: 30000, 10-12L: 30000, 12-14.25L: 45000 = 125000
assert(r.tax === 125000, `Income 15L tax = ₹1,25,000 (got ${r.tax})`);

// Test 4: Income 5L → 0 (below rebate)
r = calculateNewRegimeTax(500000 - 75000);
assert(r.total === 0, 'Income 5L → ₹0 tax (below rebate)');

// Test 5: Cess is 4%
r = calculateNewRegimeTax(2000000 - 75000);
assert(r.cess === Math.round(r.tax * 0.04), 'Cess = 4% of tax');

console.log('\n=== PF CALCULATION TESTS ===\n');

// Test 6: PF on basic ≤ 15000
let pf = calculatePF(12000);
assert(pf.employee === 1440, `PF on ₹12K basic = ₹1,440 (got ${pf.employee})`);

// Test 7: PF capped at 15000
pf = calculatePF(50000);
assert(pf.employee === 1800, `PF on ₹50K basic capped at ₹1,800 (got ${pf.employee})`);

// Test 8: PF employer = employee
assert(pf.employee === pf.employer, 'PF employer share = employee share');

console.log('\n=== ESI CALCULATION TESTS ===\n');

// Test 9: ESI not applicable > 21000
let esi = calculateESI(25000);
assert(!esi.applicable, 'ESI not applicable for gross > ₹21,000');

// Test 10: ESI applicable ≤ 21000
esi = calculateESI(18000);
assert(esi.applicable, 'ESI applicable for gross ≤ ₹21,000');
assert(esi.employee === 135, `ESI employee 0.75% of 18000 = ₹135 (got ${esi.employee})`);
assert(esi.employer === 585, `ESI employer 3.25% of 18000 = ₹585 (got ${esi.employer})`);

console.log('\n=== PROFESSIONAL TAX TESTS ===\n');

// Test 11: PT slabs
assert(calculatePT(5000) === 0, 'PT for ₹5000 = ₹0');
assert(calculatePT(8000) === 175, 'PT for ₹8000 = ₹175');
assert(calculatePT(15000) === 200, 'PT for ₹15000 = ₹200');
assert(calculatePT(100000) === 200, 'PT for ₹1L = ₹200 (max)');

console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
