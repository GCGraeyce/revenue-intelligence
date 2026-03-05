/**
 * Evercam Pricing Engine
 *
 * Standard pricing rules, discount authority matrix, and deal
 * configuration logic. This is the "rate card" the CRM ingests
 * to auto-calculate deal value and flag non-standard terms.
 *
 * All prices in EUR.
 */

// ---------------------------------------------------------------------------
// Discount Authority Matrix
// ---------------------------------------------------------------------------

export type ApproverRole = 'rep' | 'sales_manager' | 'vp_sales' | 'cro';

export interface DiscountTier {
  maxDiscountPct: number;
  approver: ApproverRole;
  requiresJustification: boolean;
  autoApprovable: boolean;
}

/**
 * Who can approve what discount level.
 * Exceeding your tier requires escalation to the next approver.
 */
export const DISCOUNT_AUTHORITY: DiscountTier[] = [
  { maxDiscountPct: 5,  approver: 'rep',           requiresJustification: false, autoApprovable: true },
  { maxDiscountPct: 15, approver: 'sales_manager',  requiresJustification: true,  autoApprovable: false },
  { maxDiscountPct: 25, approver: 'vp_sales',       requiresJustification: true,  autoApprovable: false },
  { maxDiscountPct: 35, approver: 'cro',            requiresJustification: true,  autoApprovable: false },
];

// ---------------------------------------------------------------------------
// Volume Pricing
// ---------------------------------------------------------------------------

export interface VolumeTier {
  minCameras: number;
  maxCameras: number;
  discountPct: number;
  label: string;
}

/**
 * Camera volume discounts (applies to hardware + platform fees).
 * Stacks with negotiated discounts up to authority limit.
 */
export const VOLUME_TIERS: VolumeTier[] = [
  { minCameras: 1,  maxCameras: 2,  discountPct: 0,  label: 'Standard' },
  { minCameras: 3,  maxCameras: 5,  discountPct: 5,  label: 'Multi-Site' },
  { minCameras: 6,  maxCameras: 10, discountPct: 10, label: 'Portfolio' },
  { minCameras: 11, maxCameras: 25, discountPct: 15, label: 'Enterprise' },
  { minCameras: 26, maxCameras: 999, discountPct: 20, label: 'Strategic' },
];

// ---------------------------------------------------------------------------
// Contract Terms
// ---------------------------------------------------------------------------

export interface ContractTerms {
  id: string;
  name: string;
  months: number;
  /** Discount for committing to this term length */
  termDiscount: number;
  /** Whether auto-renewal is default */
  autoRenew: boolean;
  /** Cancellation notice period in days */
  cancellationNoticeDays: number;
}

export const CONTRACT_TERMS: ContractTerms[] = [
  { id: 'TERM-6M',  name: '6-Month',  months: 6,  termDiscount: 0,    autoRenew: false, cancellationNoticeDays: 30 },
  { id: 'TERM-12M', name: '12-Month', months: 12, termDiscount: 0.05, autoRenew: true,  cancellationNoticeDays: 60 },
  { id: 'TERM-24M', name: '24-Month', months: 24, termDiscount: 0.10, autoRenew: true,  cancellationNoticeDays: 90 },
  { id: 'TERM-36M', name: '36-Month', months: 36, termDiscount: 0.15, autoRenew: true,  cancellationNoticeDays: 90 },
  { id: 'TERM-PROJECT', name: 'Project Duration', months: 0, termDiscount: 0.08, autoRenew: false, cancellationNoticeDays: 30 },
];

// ---------------------------------------------------------------------------
// SLA Tiers
// ---------------------------------------------------------------------------

export interface SLATier {
  id: string;
  name: string;
  uptimeGuarantee: number;
  responseTimeSLA: string;
  replacementSLA: string;
  monthlySurcharge: number;
  includedInManaged: boolean;
}

export const SLA_TIERS: SLATier[] = [
  {
    id: 'SLA-STANDARD',
    name: 'Standard',
    uptimeGuarantee: 0.95,
    responseTimeSLA: 'Next business day',
    replacementSLA: '5 business days',
    monthlySurcharge: 0,
    includedInManaged: false,
  },
  {
    id: 'SLA-PREMIUM',
    name: 'Premium',
    uptimeGuarantee: 0.99,
    responseTimeSLA: '4 hours',
    replacementSLA: '2 business days',
    monthlySurcharge: 100,
    includedInManaged: false,
  },
  {
    id: 'SLA-MISSION-CRITICAL',
    name: 'Mission Critical',
    uptimeGuarantee: 0.999,
    responseTimeSLA: '1 hour',
    replacementSLA: 'Next business day',
    monthlySurcharge: 250,
    includedInManaged: true,
  },
];

// ---------------------------------------------------------------------------
// Deal Calculator
// ---------------------------------------------------------------------------

export interface DealPriceEstimate {
  /** Monthly recurring revenue */
  mrr: number;
  /** Annual contract value */
  acv: number;
  /** One-time revenue (hardware + install) */
  oneTimeRevenue: number;
  /** Total contract value */
  tcv: number;
  /** Applied discounts */
  discounts: { type: string; pct: number; amount: number }[];
  /** Required approver */
  requiredApprover: ApproverRole;
}

/**
 * Calculate deal pricing from a product configuration.
 *
 * @param skus - Array of SKUs in the deal
 * @param cameraCount - Total number of cameras
 * @param contractMonths - Contract duration
 * @param negotiatedDiscountPct - Additional negotiated discount (0-1)
 */
export function calculateDealPrice(
  products: { sku: string; listPriceMonthly: number; oneTimeCost: number }[],
  cameraCount: number,
  contractMonths: number,
  negotiatedDiscountPct: number = 0,
): DealPriceEstimate {
  const discounts: { type: string; pct: number; amount: number }[] = [];

  // Base monthly total
  let baseMRR = products.reduce((sum, p) => sum + p.listPriceMonthly, 0);
  let oneTimeTotal = products.reduce((sum, p) => sum + p.oneTimeCost, 0);

  // Volume discount
  const volumeTier = VOLUME_TIERS.find(
    (t) => cameraCount >= t.minCameras && cameraCount <= t.maxCameras,
  ) ?? VOLUME_TIERS[0];
  if (volumeTier.discountPct > 0) {
    const volumeAmt = baseMRR * (volumeTier.discountPct / 100);
    discounts.push({ type: `Volume (${volumeTier.label})`, pct: volumeTier.discountPct / 100, amount: volumeAmt });
    baseMRR -= volumeAmt;
  }

  // Term discount
  const term = CONTRACT_TERMS.find((t) => t.months === contractMonths);
  if (term && term.termDiscount > 0) {
    const termAmt = baseMRR * term.termDiscount;
    discounts.push({ type: `Term (${term.name})`, pct: term.termDiscount, amount: termAmt });
    baseMRR -= termAmt;
  }

  // Negotiated discount
  if (negotiatedDiscountPct > 0) {
    const negAmt = baseMRR * negotiatedDiscountPct;
    discounts.push({ type: 'Negotiated', pct: negotiatedDiscountPct, amount: negAmt });
    baseMRR -= negAmt;
  }

  // Total discount to determine approver
  const totalDiscountPct = discounts.reduce((sum, d) => sum + d.pct, 0);
  const requiredApprover = getRequiredApprover(totalDiscountPct * 100);

  const acv = baseMRR * 12;
  const effectiveMonths = contractMonths || 12;
  const tcv = baseMRR * effectiveMonths + oneTimeTotal;

  return {
    mrr: Math.round(baseMRR * 100) / 100,
    acv: Math.round(acv * 100) / 100,
    oneTimeRevenue: Math.round(oneTimeTotal * 100) / 100,
    tcv: Math.round(tcv * 100) / 100,
    discounts,
    requiredApprover,
  };
}

function getRequiredApprover(totalDiscountPct: number): ApproverRole {
  for (const tier of DISCOUNT_AUTHORITY) {
    if (totalDiscountPct <= tier.maxDiscountPct) return tier.approver;
  }
  return 'cro';
}
