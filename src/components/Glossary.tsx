import { ReactNode, useState } from 'react';
import { Info } from 'lucide-react';

/**
 * Business glossary — maps every metric/term in the UI to a plain-language
 * explanation that non-technical stakeholders can understand at a glance.
 */
export const GLOSSARY: Record<string, { short: string; detail: string }> = {
  // ── Pipeline & Deal Terms ──
  'PQS': {
    short: 'Pipeline Quality Score',
    detail: 'A 0-100 composite score that measures how healthy a deal is. It combines outcome probability, ICP fit, persona coverage, process adherence, engagement velocity, price risk, and stage progression. Higher = healthier deal.',
  },
  'PQ Score': {
    short: 'Pipeline Quality Score',
    detail: 'Same as PQS. A 0-100 composite score that measures how healthy a deal is based on 7 weighted dimensions.',
  },
  'ACV': {
    short: 'Annual Contract Value',
    detail: 'The total annual revenue expected from this deal. For multi-year contracts, this is the annualised amount. Expressed in EUR (€).',
  },
  'ICP Score': {
    short: 'Ideal Customer Profile Score',
    detail: 'How well this prospect matches Evercam\'s ideal customer profile. Based on company size, industry, project value, and fit signals. Higher = better fit.',
  },
  'ICP Fit': {
    short: 'Ideal Customer Profile Fit',
    detail: 'A score (0-100) measuring how well a prospect matches the ideal customer characteristics for Evercam. Considers firmographic data, industry, project type, and technology stack alignment.',
  },
  'Pipeline Coverage': {
    short: 'Pipeline-to-Target Ratio',
    detail: 'Total pipeline value divided by revenue target. A healthy pipeline should be 3x or more of your target — meaning €3 in pipeline for every €1 of target. Below 3x signals a coverage gap.',
  },
  'Quality-Adjusted': {
    short: 'Probability-Weighted Pipeline',
    detail: 'Pipeline value adjusted by win probability. Each deal\'s ACV is multiplied by its likelihood of closing. This gives a more realistic forecast than raw pipeline total.',
  },
  'At Risk': {
    short: 'Deals Likely to Slip or Lose',
    detail: 'Deals with a PQS below 40, indicating poor deal health. These need immediate attention — they\'re likely to stall, slip to next quarter, or be lost entirely.',
  },
  'Slip Exposure': {
    short: 'Revenue at Risk of Slipping',
    detail: 'Total ACV of deals that may slip to the next quarter. Calculated from deals with PQS < 40 and negative stage velocity signals.',
  },
  'Grade': {
    short: 'Deal Health Grade (A-F)',
    detail: 'A letter grade derived from PQS. A (≥80) = healthy, B (≥65) = good, C (≥50) = needs attention, D (≥35) = at risk, F (<35) = critical. Maps directly to the PQ Score.',
  },

  // ── Persona & Multi-Threading ──
  'Persona Gaps': {
    short: 'Missing Buyer Contacts',
    detail: 'Key decision-making roles not yet engaged in the deal. In construction sales, missing the Economic Buyer (CFO) or Champion (MD) late in the cycle is a major risk — deals close 31% slower without multi-threading.',
  },
  'Persona Coverage': {
    short: 'Buying Committee Engagement',
    detail: 'How many required buyer personas are actively engaged. Each deal stage has required personas — if they\'re missing, the deal is under-threaded and at higher risk of stalling.',
  },
  'Multi-Threading': {
    short: 'Engaging Multiple Stakeholders',
    detail: 'The practice of building relationships with multiple people in the buying organisation. Single-threaded deals (only one contact) are 2.4x more likely to be lost. Multi-threading means engaging the PM, CFO, IT, and Executive Sponsor.',
  },
  'Economic Buyer': {
    short: 'Person Who Controls Budget',
    detail: 'The CFO, Finance Director, or Commercial Director who holds the budget authority. Must be engaged by Proposal stage — deals without EB access close at less than half the rate.',
  },
  'Champion': {
    short: 'Internal Advocate for the Deal',
    detail: 'The MD, CEO, or VP Construction who actively sponsors and champions your solution internally. They sell on your behalf when you\'re not in the room.',
  },
  'Technical Evaluator': {
    short: 'IT/Digital Construction Decision Maker',
    detail: 'The IT Director or Digital Construction Manager who evaluates technical fit — integrations, security, APIs, and infrastructure requirements.',
  },

  // ── Process & Stages ──
  'Missing Steps': {
    short: 'Uncompleted Sales Process Steps',
    detail: 'Required activities for the current stage that haven\'t been done yet. Examples: "Demo scheduled with decision maker", "ROI calculator walkthrough with CFO". Missing steps lower the PQS and delay progression.',
  },
  'Process Adherence': {
    short: 'Sales Process Completion',
    detail: 'How well the rep is following the defined sales playbook. Tracks required milestones per stage — discovery calls, technical reviews, proposal delivery, contract sign-off.',
  },
  'Days in Stage': {
    short: 'Time Spent in Current Stage',
    detail: 'How many calendar days the deal has been in its current pipeline stage. Each stage has a typical duration — exceeding it signals a stall. Discovery: 3-14 days, Qualification: 7-21 days, Proposal: 7-30 days, Negotiation: 5-21 days.',
  },
  'Stage Progression': {
    short: 'Speed Through Pipeline',
    detail: 'How fast deals move through pipeline stages compared to the expected cadence. Faster progression correlates with higher win rates. Stalled deals (20+ days) need intervention.',
  },
  'MEDDIC': {
    short: 'Sales Qualification Framework',
    detail: 'Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion. A structured methodology for qualifying enterprise deals. Evercam uses MEDDPICC (adds Paper Process and Competition).',
  },

  // ── Forecasting ──
  'Confidence Band': {
    short: 'Forecast Range (Low-High)',
    detail: 'The range within which actual revenue is expected to land. Calculated from deal-level probabilities and historical variance. Narrow band = high confidence, wide band = more uncertainty.',
  },
  'Forecast Attainment': {
    short: 'Predicted vs Target Revenue',
    detail: 'The percentage of your revenue target that the quality-adjusted pipeline is expected to deliver. 100% = on track, <80% = action needed, >110% = overperforming.',
  },
  'Commit': {
    short: 'Deals Committed to Close',
    detail: 'Deals the rep is confident will close this quarter. Commit deals should have high PQS (65+), engaged Economic Buyer, and be in Proposal or Negotiation stage.',
  },

  // ── Risk ──
  'Price Risk': {
    short: 'Discount Probability',
    detail: 'Likelihood that the deal will require excessive discounting. High price risk (>50%) means the prospect is price-sensitive and may push for discounts that erode margin.',
  },
  'Engagement Velocity': {
    short: 'Buyer Interaction Frequency',
    detail: 'How recently and frequently the buyer is engaging — emails, meetings, product usage. Declining velocity is an early warning that the deal may be going cold.',
  },
  'Single-Stakeholder Enterprise': {
    short: 'Enterprise Deal with Only One Contact',
    detail: 'High-value deals (€100K+) where only one buyer persona is engaged. Enterprise decisions involve 5-7 people on average — being single-threaded means you\'re at severe risk of being blindsided.',
  },
  'Stalled After Proposal': {
    short: 'Deals Stuck in Proposal Stage',
    detail: 'Deals that have been in the Proposal stage for 20+ days without progression. Usually indicates missing Economic Buyer engagement, unresolved objections, or lost internal momentum.',
  },

  // ── Coaching ──
  'HITL': {
    short: 'Human-in-the-Loop',
    detail: 'A coaching mode where AI suggests actions but a human manager must review and approve each one before it executes. Gives managers full control and builds trust in the AI\'s recommendations.',
  },
  'Agentic': {
    short: 'Autonomous AI Actions',
    detail: 'A coaching mode where the AI autonomously executes coaching actions (sends nudges, schedules follow-ups, triggers plays) without waiting for human approval. Actions can be undone after the fact.',
  },
  'Coaching Play': {
    short: 'Structured Intervention Pattern',
    detail: 'A predefined sequence of actions triggered by specific deal signals. Examples: "EB Recovery" (engage missing Economic Buyer), "Stall Breaker" (re-engage stalled deal), "Multi-Thread Campaign" (expand contacts).',
  },

  // ── Team & Targets ──
  'Attainment': {
    short: 'Percentage of Target Achieved',
    detail: 'Weighted pipeline value divided by annual sales target. Shows how close a rep or manager is to hitting their goal. Below 50% mid-quarter = urgent action needed.',
  },
  'Weighted Pipeline': {
    short: 'Probability-Adjusted Revenue',
    detail: 'Sum of (deal ACV × win probability) for all deals. More accurate than raw pipeline because it accounts for deal health and likelihood of closing.',
  },
  'Gap': {
    short: 'Revenue Still Needed',
    detail: 'The difference between the annual target and current weighted pipeline. Represents how much more revenue needs to be generated or won to hit target.',
  },

  // ── ICP Profiles ──
  'Tier 1 Infrastructure Developer': {
    short: 'Top-tier Enterprise ICP',
    detail: 'Large infrastructure firms (500-50K employees) with multi-year projects worth €50M-€5B. Government/PPP funded, multi-site operations, BIM workflows. Highest ICP fit weight (1.0). Historical win rate: 42%.',
  },
  'Tier 1 Property Developer': {
    short: 'Enterprise Property ICP',
    detail: 'Property developers (200-10K employees) with concurrent developments worth €20M-€500M. Investor reporting needs, marketing-driven, using Procore/PlanGrid. ICP fit weight: 0.95. Historical win rate: 48%.',
  },
  'Tier 2 General Contractor': {
    short: 'Mid-Market Contractor ICP',
    detail: 'General contractors (50-500 employees) with projects worth €5M-€100M. Repeat builders with 3+ projects/year, client-mandated documentation. ICP fit weight: 0.80. Historical win rate: 38%.',
  },
  'Specialty Contractor': {
    short: 'Data Center / Pharma ICP',
    detail: 'Specialty contractors (100-2K employees) building data centers or pharma facilities worth €10M-€200M. Regulatory audit trails, hyperscaler clients. ICP fit weight: 0.85. Historical win rate: 52%.',
  },
  'SMB Builder': {
    short: 'Small Builder ICP',
    detail: 'Small builders/fit-out specialists (5-50 employees) with projects worth €500K-€10M. Time-lapse for marketing, remote monitoring. Lowest ICP fit weight: 0.55. Historical win rate: 30%.',
  },

  // ── Model Health ──
  'Outcome Probability': {
    short: 'ML-Predicted Win/Loss Likelihood',
    detail: 'The strongest single predictor of close. Combines machine learning probability signals across win, loss, slip, and no-decision outcomes. Weight: 30% of PQS.',
  },
};

/**
 * Hoverable term component — renders an inline term with an underline that
 * shows a tooltip on hover. Uses pure CSS positioning for zero-dependency tooltips.
 */
export function Term({ term, children }: { term: string; children?: ReactNode }) {
  const entry = GLOSSARY[term];
  const [show, setShow] = useState(false);

  if (!entry) {
    return <span>{children || term}</span>;
  }

  return (
    <span
      className="relative inline-flex items-center gap-0.5 group cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="border-b border-dotted border-muted-foreground/40 group-hover:border-primary transition-colors">
        {children || term}
      </span>
      <Info className="w-2.5 h-2.5 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72 pointer-events-none animate-fade-in">
          <span className="block bg-popover border border-border shadow-lg rounded-lg p-3 text-left">
            <span className="block text-[10px] uppercase tracking-widest text-primary font-semibold mb-1">
              {entry.short}
            </span>
            <span className="block text-xs text-muted-foreground leading-relaxed">
              {entry.detail}
            </span>
          </span>
          <span className="block w-2 h-2 bg-popover border-r border-b border-border rotate-45 mx-auto -mt-1" />
        </span>
      )}
    </span>
  );
}

/**
 * Metric label with built-in glossary tooltip.
 * Use instead of raw text for any dashboard metric label.
 */
export function MetricLabel({ term, className }: { term: string; className?: string }) {
  return (
    <span className={className || 'metric-label'}>
      <Term term={term}>{term}</Term>
    </span>
  );
}
