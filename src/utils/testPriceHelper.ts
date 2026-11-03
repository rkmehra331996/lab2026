/**
 * Standard diagnostic test prices catalog and resolution helper.
 * Ensures every prescribed test displays its individual rate/price,
 * and the sum cleanly matches the receipt's Grand Total (कुल योग).
 */

export const STANDARD_TEST_PRICES: Record<string, number> = {
  cbc: 300,
  hemogram: 350,
  'complete blood count': 300,
  lft: 650,
  'liver function': 650,
  kft: 550,
  rft: 550,
  'kidney function': 550,
  'renal function': 550,
  lipid: 500,
  cholesterol: 200,
  thyroid: 450,
  tsh: 250,
  t3: 200,
  t4: 200,
  glucose: 120,
  sugar: 120,
  fbs: 120,
  ppbs: 120,
  rbs: 120,
  fasting: 120,
  hba1c: 450,
  urine: 150,
  stool: 150,
  electrolytes: 450,
  calcium: 200,
  uric: 180,
  creatinine: 150,
  urea: 150,
  esr: 100,
  widal: 250,
  dengue: 650,
  malaria: 200,
  hiv: 300,
  hbsag: 250,
  hcv: 300,
  vdrl: 180,
  'vitamin d': 1200,
  'vitamin b12': 900,
  iron: 500,
  ferritin: 600,
  crp: 350,
  troponin: 900,
  sgpt: 150,
  sgot: 150,
  bilirubin: 150,
  amylase: 450,
  lipase: 500,
  semen: 350,
  mantoux: 200,
  culture: 650,
  fnac: 800,
  pap: 600,
  biopsy: 1200,
  'blood group': 100,
  abo: 100,
};

export interface ResolvedReceiptTest {
  name: string;
  price: number;
}

/**
 * Resolves each test's price and guarantees that the sum matches
 * totalAmount (gross), providing clear rates for each test item.
 */
export function resolveReceiptTestsWithPrices(
  tests: Array<string | { name: string; price?: number }>,
  totalAmount?: number
): ResolvedReceiptTest[] {
  if (!tests || tests.length === 0) {
    return [{ name: 'Diagnostic Investigation', price: totalAmount && totalAmount > 0 ? totalAmount : 300 }];
  }

  // Extract raw test names and base prices
  const parsedItems = tests.map((t) => {
    const name = typeof t === 'string' ? t.trim() : (t.name || '').trim();
    let price: number | null = null;
    if (typeof t === 'object' && t && typeof t.price === 'number' && t.price > 0) {
      price = t.price;
    }
    return { name, price };
  });

  const count = parsedItems.length;
  const gross = typeof totalAmount === 'number' && totalAmount > 0 ? totalAmount : 0;

  // Single test case: Price is exactly the gross total if available, else standard price
  if (count === 1) {
    const single = parsedItems[0];
    if (gross > 0) {
      return [{ name: single.name || 'Diagnostic Investigation', price: gross }];
    }
    if (single.price && single.price > 0) {
      return [{ name: single.name || 'Diagnostic Investigation', price: single.price }];
    }
    const matchedPrice = lookupCatalogPrice(single.name);
    return [{ name: single.name || 'Diagnostic Investigation', price: matchedPrice }];
  }

  // Multiple tests: lookup catalog price for each
  const rawPrices = parsedItems.map((item) => {
    if (item.price && item.price > 0) return item.price;
    return lookupCatalogPrice(item.name);
  });

  // If gross is provided and differs from raw sum, align proportionally so sum === gross
  if (gross > 0) {
    const sumRaw = rawPrices.reduce((acc, p) => acc + p, 0);
    if (sumRaw === gross) {
      return parsedItems.map((item, idx) => ({
        name: item.name,
        price: rawPrices[idx],
      }));
    }

    // Proportionally scale to match gross exactly
    const calculated: number[] = [];
    let allocated = 0;
    for (let i = 0; i < count; i++) {
      if (i === count - 1) {
        // Last test absorbs any rounding diff so sum === gross
        const remainder = Math.max(0, gross - allocated);
        calculated.push(remainder);
      } else {
        const share = Math.round((rawPrices[i] / (sumRaw || 1)) * gross);
        calculated.push(share);
        allocated += share;
      }
    }

    return parsedItems.map((item, idx) => ({
      name: item.name,
      price: calculated[idx],
    }));
  }

  // No gross provided: return raw catalog prices
  return parsedItems.map((item, idx) => ({
    name: item.name,
    price: rawPrices[idx],
  }));
}

function lookupCatalogPrice(testName: string): number {
  if (!testName) return 300;
  const lower = testName.toLowerCase();
  for (const [key, price] of Object.entries(STANDARD_TEST_PRICES)) {
    if (lower.includes(key)) {
      return price;
    }
  }
  return 300; // fallback standard test rate
}
