/**
 * Evercam Customer Context
 *
 * Defines Ideal Customer Profiles (ICP), buyer personas, competitor
 * intelligence, sales playbook stages, and objection handling.
 * These context files are ingested by the CRM extension to enrich
 * deal scoring, coaching, and explainability.
 */

// ---------------------------------------------------------------------------
// Ideal Customer Profile (ICP)
// ---------------------------------------------------------------------------

export interface ICPProfile {
  id: string;
  name: string;
  segment: 'SMB' | 'Mid-Market' | 'Enterprise';
  /** ICP fit score weight (0-1) */
  fitWeight: number;
  industry: string;
  companySize: { minEmployees: number; maxEmployees: number };
  projectValue: { min: number; max: number };
  /** Key characteristics that indicate strong fit */
  fitSignals: string[];
  /** Red flags that indicate poor fit */
  disqualifiers: string[];
  /** Typical project duration in months */
  typicalProjectMonths: { min: number; max: number };
  /** Historical win rate for this profile */
  historicalWinRate: number;
}

export const ICP_PROFILES: ICPProfile[] = [
  {
    id: 'ICP-TIER1-INFRA',
    name: 'Tier 1 Infrastructure Developer',
    segment: 'Enterprise',
    fitWeight: 1.0,
    industry: 'Infrastructure & Civil Engineering',
    companySize: { minEmployees: 500, maxEmployees: 50000 },
    projectValue: { min: 50_000_000, max: 5_000_000_000 },
    fitSignals: [
      'Multi-year infrastructure projects (roads, bridges, rail, airports)',
      'Government or PPP funded',
      'Multi-site operations (5+ concurrent projects)',
      'Existing BIM workflow (Bentley, Autodesk)',
      'Safety compliance requirements (ISO 45001)',
      'Public stakeholder reporting obligations',
    ],
    disqualifiers: [
      'Single project with no pipeline',
      'Budget under €50K for monitoring',
      'No digital construction mandate',
    ],
    typicalProjectMonths: { min: 18, max: 60 },
    historicalWinRate: 0.42,
  },
  {
    id: 'ICP-TIER1-PROPDEV',
    name: 'Tier 1 Property Developer',
    segment: 'Enterprise',
    fitWeight: 0.95,
    industry: 'Property Development',
    companySize: { minEmployees: 200, maxEmployees: 10000 },
    projectValue: { min: 20_000_000, max: 500_000_000 },
    fitSignals: [
      'Multiple concurrent residential/commercial developments',
      'Investor reporting requirements',
      'Marketing-driven (needs time-lapse for launches)',
      'Remote site management needed',
      'Using Procore, PlanGrid, or Oracle Aconex',
      'ESG/sustainability reporting',
    ],
    disqualifiers: [
      'Single small-scale renovation',
      'No interest in visual documentation',
    ],
    typicalProjectMonths: { min: 12, max: 36 },
    historicalWinRate: 0.48,
  },
  {
    id: 'ICP-TIER2-CONTRACTOR',
    name: 'Tier 2 General Contractor',
    segment: 'Mid-Market',
    fitWeight: 0.80,
    industry: 'General Contracting',
    companySize: { minEmployees: 50, maxEmployees: 500 },
    projectValue: { min: 5_000_000, max: 100_000_000 },
    fitSignals: [
      'Repeat builder with 3+ projects/year',
      'Client-mandated documentation',
      'Remote project management needs',
      'Safety officer on staff',
      'Dispute history motivating visual evidence',
    ],
    disqualifiers: [
      'One-off project with no repeat potential',
      'Sub-contractor only (no site control)',
    ],
    typicalProjectMonths: { min: 6, max: 24 },
    historicalWinRate: 0.38,
  },
  {
    id: 'ICP-TIER2-SPECIALITY',
    name: 'Specialty Contractor (Data Centers / Pharma)',
    segment: 'Mid-Market',
    fitWeight: 0.85,
    industry: 'Specialty Construction',
    companySize: { minEmployees: 100, maxEmployees: 2000 },
    projectValue: { min: 10_000_000, max: 200_000_000 },
    fitSignals: [
      'Cleanroom or controlled environment builds',
      'Regulatory audit trail requirements',
      'Client is hyperscaler (AWS, Google, Meta) or pharma',
      'Security-sensitive sites requiring access control',
      'High-value asset tracking needed',
    ],
    disqualifiers: [
      'No compliance requirement',
      'Low-value fit-out only',
    ],
    typicalProjectMonths: { min: 12, max: 30 },
    historicalWinRate: 0.52,
  },
  {
    id: 'ICP-TIER3-SMB',
    name: 'SMB Builder / Fit-Out Specialist',
    segment: 'SMB',
    fitWeight: 0.55,
    industry: 'Residential / Commercial Fit-Out',
    companySize: { minEmployees: 5, maxEmployees: 50 },
    projectValue: { min: 500_000, max: 10_000_000 },
    fitSignals: [
      'Wants time-lapse for client marketing',
      'Remote monitoring (owner not on-site daily)',
      'Insurance documentation needs',
      'Repeat renovation projects',
    ],
    disqualifiers: [
      'One-off homeowner project',
      'Budget sensitivity (< €5K/year)',
      'No smartphone/tech adoption',
    ],
    typicalProjectMonths: { min: 3, max: 12 },
    historicalWinRate: 0.30,
  },
];

// ---------------------------------------------------------------------------
// Buyer Personas
// ---------------------------------------------------------------------------

export interface BuyerPersona {
  id: string;
  role: string;
  title: string;
  /** How critical this persona is to the sale (1-5) */
  importance: number;
  /** What they care about most */
  priorities: string[];
  /** Common objections from this persona */
  objections: string[];
  /** How to win them over */
  engagementTips: string[];
  /** Typical involvement stage */
  activeStages: string[];
}

export const BUYER_PERSONAS: BuyerPersona[] = [
  {
    id: 'PERSONA-PM',
    role: 'Project Manager',
    title: 'Project Manager / Site Manager',
    importance: 5,
    priorities: [
      'Real-time site visibility without travel',
      'Progress documentation for client reporting',
      'Dispute prevention with timestamped evidence',
      'Subcontractor accountability',
    ],
    objections: [
      'We already use CCTV',
      'Our sites have poor connectivity',
      'Installing cameras delays construction start',
    ],
    engagementTips: [
      'Demo live view + mobile app on their actual site photos',
      'Show time-lapse example from similar project type',
      'Offer free 2-week trial on their next project',
    ],
    activeStages: ['Discovery', 'Qualification', 'Proposal', 'Negotiation'],
  },
  {
    id: 'PERSONA-SAFETY',
    role: 'Safety Officer',
    title: 'Health & Safety Manager / EHS Director',
    importance: 4,
    priorities: [
      'PPE compliance monitoring',
      'Incident investigation evidence',
      'Safety audit documentation',
      'Reducing site visits for safety inspections',
    ],
    objections: [
      'AI detection isn\'t reliable enough',
      'Privacy concerns with worker monitoring',
      'We need ISO 45001 compliance documentation',
    ],
    engagementTips: [
      'Lead with AI analytics demo (PPE detection)',
      'Share safety compliance case study',
      'Position as safety tool, not surveillance',
    ],
    activeStages: ['Discovery', 'Qualification', 'Proposal'],
  },
  {
    id: 'PERSONA-CFO',
    role: 'Economic Buyer',
    title: 'CFO / Finance Director / Commercial Director',
    importance: 5,
    priorities: [
      'ROI justification (savings vs. camera cost)',
      'Dispute cost avoidance',
      'Insurance premium reduction',
      'Predictable billing (no surprise costs)',
    ],
    objections: [
      'What\'s the ROI?',
      'Can we just use consumer cameras?',
      'Capital vs. operational expenditure preference',
    ],
    engagementTips: [
      'Lead with ROI calculator showing dispute avoidance savings',
      'Present case study with quantified savings',
      'Offer flexible billing (monthly vs. annual vs. project-based)',
    ],
    activeStages: ['Qualification', 'Proposal', 'Negotiation'],
  },
  {
    id: 'PERSONA-IT',
    role: 'Technical Evaluator',
    title: 'IT Director / Digital Construction Manager',
    importance: 3,
    priorities: [
      'Integration with existing tech stack (Procore, BIM)',
      'Security & data privacy (ISO 27001, SOC 2)',
      'API access and data export',
      'Bandwidth/network requirements',
    ],
    objections: [
      'Does it integrate with Procore/Autodesk?',
      'Where is data stored? GDPR compliance?',
      'What bandwidth does it require on-site?',
    ],
    engagementTips: [
      'Share security documentation and certifications upfront',
      'Offer API sandbox access',
      'Connect with Evercam solutions architect',
    ],
    activeStages: ['Qualification', 'Proposal'],
  },
  {
    id: 'PERSONA-EXEC',
    role: 'Champion / Executive Sponsor',
    title: 'Managing Director / CEO / VP Construction',
    importance: 5,
    priorities: [
      'Portfolio-wide visibility across all projects',
      'Client satisfaction and marketing (time-lapses)',
      'Competitive advantage through digital construction',
      'Risk reduction across the business',
    ],
    objections: [
      'We\'ve managed fine without cameras',
      'My PMs don\'t want to be monitored',
      'We\'re too busy to implement new tech right now',
    ],
    engagementTips: [
      'Executive briefing with portfolio dashboard demo',
      'Share peer company adoption story',
      'Start with one flagship project as proof of concept',
    ],
    activeStages: ['Discovery', 'Negotiation'],
  },
];

// ---------------------------------------------------------------------------
// Competitor Intelligence
// ---------------------------------------------------------------------------

export interface Competitor {
  id: string;
  name: string;
  website: string;
  strengths: string[];
  weaknesses: string[];
  typicalPricing: string;
  /** Win rate when Evercam competes against this vendor */
  evercamWinRate: number;
  /** Key battlecard talking points */
  battlecard: string[];
  marketPresence: string;
}

export const COMPETITORS: Competitor[] = [
  {
    id: 'COMP-OXBLUE',
    name: 'OxBlue',
    website: 'oxblue.com',
    strengths: [
      'Strong US market presence',
      'Procore integration',
      'AI-based platform',
      'Good brand recognition in North America',
    ],
    weaknesses: [
      'Limited international presence',
      'No BIM integration',
      'Higher total cost for multi-site',
      'Fewer camera hardware options',
    ],
    typicalPricing: '$400-600/camera/month (US market)',
    evercamWinRate: 0.55,
    battlecard: [
      'Evercam has BIM integration (Bentley iTwin) — OxBlue does not',
      'Evercam\'s global presence (20+ countries) vs OxBlue\'s US focus',
      'Solar-powered option eliminates site power dependency',
      'Unlimited users included vs OxBlue per-seat pricing',
    ],
    marketPresence: 'North America (primary), limited international',
  },
  {
    id: 'COMP-EARTHCAM',
    name: 'EarthCam',
    website: 'earthcam.com',
    strengths: [
      'Largest market player (200+ employees)',
      '$1T+ in documented projects',
      'PlanGrid integration',
      'Strong AI video analytics',
      'Brand recognition from public webcams',
    ],
    weaknesses: [
      'Premium pricing (enterprise focus)',
      'Complex sales process',
      'Less flexible for SMB/mid-market',
      'Heavier hardware requirements',
    ],
    typicalPricing: '$600-1000/camera/month (enterprise)',
    evercamWinRate: 0.45,
    battlecard: [
      'Evercam is more cost-effective for 3-10 camera deployments',
      'Evercam\'s managed service is all-inclusive (no hidden fees)',
      'Faster deployment: Evercam installs in 1 day vs EarthCam\'s 1-2 weeks',
      'Evercam includes unlimited time-lapses at no extra cost',
    ],
    marketPresence: 'Global, enterprise-focused, 13+ offices worldwide',
  },
  {
    id: 'COMP-TRUELOOK',
    name: 'TrueLook',
    website: 'truelook.com',
    strengths: [
      'Easy self-install solar cameras',
      'Good Procore integration',
      'Competitive mid-market pricing',
      'Simple user interface',
    ],
    weaknesses: [
      'Limited AI capabilities',
      'No BIM integration',
      'Smaller support team',
      'Limited international availability',
    ],
    typicalPricing: '$350-500/camera/month',
    evercamWinRate: 0.60,
    battlecard: [
      'Evercam AI Analytics suite far exceeds TrueLook capabilities',
      'Evercam\'s 4D BIM integration is a differentiator TrueLook can\'t match',
      'Evercam 24/7 live support vs TrueLook business hours only',
      '360° virtual tours capability not available from TrueLook',
    ],
    marketPresence: 'North America, mid-market focus',
  },
  {
    id: 'COMP-SENSERA',
    name: 'Sensera Systems',
    website: 'senserasystems.com',
    strengths: [
      'Good solar camera hardware',
      'Affordable entry point',
      'Simple dashboard',
      'PlanGrid integration',
    ],
    weaknesses: [
      'Limited software features',
      'No time-lapse creation tools',
      'Basic analytics only',
      'Small company / limited roadmap',
    ],
    typicalPricing: '$200-400/camera/month',
    evercamWinRate: 0.65,
    battlecard: [
      'Evercam\'s full platform vs Sensera\'s basic monitoring',
      'Professional time-lapse production included with Evercam',
      'Evercam\'s AI analytics are enterprise-grade',
      'Gate reporting and ANPR not available from Sensera',
    ],
    marketPresence: 'North America, SMB/mid-market',
  },
  {
    id: 'COMP-DIY',
    name: 'DIY (Consumer Cameras / CCTV)',
    website: '',
    strengths: [
      'Lowest upfront cost',
      'Familiar hardware (Ring, Hikvision, etc.)',
      'No recurring subscription',
      'Self-managed',
    ],
    weaknesses: [
      'No cloud platform or dashboard',
      'No time-lapse automation',
      'No AI analytics',
      'No project archiving',
      'Theft/vandalism risk on construction sites',
      'No remote access reliability',
      'No support or SLA',
    ],
    typicalPricing: '$100-300 one-time per camera',
    evercamWinRate: 0.70,
    battlecard: [
      'Consumer cameras aren\'t designed for construction site conditions',
      'No cloud recording means footage is lost if hardware is stolen',
      'ROI from one prevented dispute pays for 2+ years of Evercam',
      'Time-lapse marketing content value alone justifies subscription',
      'No audit trail or legal-grade timestamps',
    ],
    marketPresence: 'Universal (not a direct competitor, but common alternative)',
  },
];

// ---------------------------------------------------------------------------
// Sales Playbook — Stage Definitions
// ---------------------------------------------------------------------------

export interface PlaybookStage {
  stage: string;
  description: string;
  exitCriteria: string[];
  requiredActivities: string[];
  typicalDuration: { minDays: number; maxDays: number };
  /** Persona roles that should be engaged by this stage */
  requiredPersonas: string[];
  /** Coaching triggers — if these aren't met, coaching fires */
  coachingTriggers: string[];
}

export const SALES_PLAYBOOK: PlaybookStage[] = [
  {
    stage: 'Discovery',
    description: 'Identify project needs, site conditions, and stakeholder map. Establish whether Evercam can add value to their construction projects.',
    exitCriteria: [
      'Project type and timeline confirmed',
      'Number of sites and cameras estimated',
      'Key stakeholders identified',
      'Current monitoring approach documented',
      'Budget range discussed',
    ],
    requiredActivities: [
      'Initial discovery call (30 min)',
      'Site conditions questionnaire',
      'Stakeholder mapping',
      'ICP fit assessment completed',
    ],
    typicalDuration: { minDays: 3, maxDays: 14 },
    requiredPersonas: ['Project Manager'],
    coachingTriggers: [
      'No discovery call scheduled within 3 days of lead creation',
      'ICP fit assessment not completed within 7 days',
      'No stakeholder map after discovery call',
    ],
  },
  {
    stage: 'Qualification',
    description: 'Validate budget, authority, need, and timeline (BANT). Confirm ICP fit and technical requirements.',
    exitCriteria: [
      'Budget confirmed or range agreed',
      'Decision maker identified and engaged',
      'Technical requirements documented',
      'Project timeline aligns with Evercam deployment',
      'Competitive landscape understood',
    ],
    requiredActivities: [
      'Technical requirements review',
      'Site survey (virtual or in-person)',
      'Champion identified and validated',
      'Competitive assessment completed',
      'Demo scheduled with decision maker',
    ],
    typicalDuration: { minDays: 7, maxDays: 21 },
    requiredPersonas: ['Project Manager', 'Technical Evaluator'],
    coachingTriggers: [
      'No decision maker identified after 14 days in Qualification',
      'No demo scheduled within 7 days of qualification',
      'Technical requirements review not completed',
    ],
  },
  {
    stage: 'Proposal',
    description: 'Present solution, pricing, and business case. Address technical and commercial objections.',
    exitCriteria: [
      'Formal proposal delivered',
      'Pricing reviewed with economic buyer',
      'ROI / business case accepted',
      'Security/compliance requirements addressed',
      'Contract terms agreed in principle',
    ],
    requiredActivities: [
      'Solution design (camera placement, products)',
      'Proposal document sent',
      'ROI calculator walkthrough with CFO',
      'Reference customer call offered',
      'Security documentation shared (if requested)',
    ],
    typicalDuration: { minDays: 7, maxDays: 30 },
    requiredPersonas: ['Project Manager', 'Economic Buyer', 'Technical Evaluator'],
    coachingTriggers: [
      'Proposal not sent within 5 days of entering Proposal stage',
      'Economic buyer not engaged after proposal delivery',
      'No ROI discussion with finance stakeholder',
      'Competitor mentioned but battlecard not reviewed',
    ],
  },
  {
    stage: 'Negotiation',
    description: 'Finalize commercial terms, contracts, and deployment plan. Remove last objections and secure commitment.',
    exitCriteria: [
      'Commercial terms agreed',
      'Contract reviewed by legal (if required)',
      'Deployment date confirmed',
      'PO or signature obtained',
      'Onboarding scheduled',
    ],
    requiredActivities: [
      'Commercial negotiation meeting',
      'Discount approval (if needed)',
      'Contract redline and sign-off',
      'Deployment planning session',
      'Success criteria agreed for first 90 days',
    ],
    typicalDuration: { minDays: 5, maxDays: 21 },
    requiredPersonas: ['Economic Buyer', 'Champion / Executive Sponsor'],
    coachingTriggers: [
      'Deal stalled in Negotiation for 14+ days',
      'Discount exceeds rep authority without escalation',
      'No deployment date after terms agreed',
      'Contract sent but no response for 7+ days',
    ],
  },
];

// ---------------------------------------------------------------------------
// Common Objections & Responses
// ---------------------------------------------------------------------------

export interface Objection {
  id: string;
  objection: string;
  category: 'price' | 'technical' | 'timing' | 'competition' | 'internal';
  persona: string;
  response: string;
  supportingAsset: string;
}

export const COMMON_OBJECTIONS: Objection[] = [
  {
    id: 'OBJ-ROI',
    objection: 'What\'s the ROI? Cameras seem like a nice-to-have.',
    category: 'price',
    persona: 'Economic Buyer',
    response: 'One prevented dispute or delay typically costs 10-50x the annual camera subscription. Our ROI calculator shows most customers break even within 3 months. For a €200M project, a single month of avoided delay saves €500K+ — vs €30K/year for full site monitoring.',
    supportingAsset: 'ROI Calculator + Dispute Avoidance Case Study',
  },
  {
    id: 'OBJ-CCTV',
    objection: 'We already have CCTV on site.',
    category: 'competition',
    persona: 'Project Manager',
    response: 'CCTV records locally but doesn\'t provide cloud access, time-lapses, AI analytics, or project archiving. If the recorder is stolen or damaged, all footage is lost. Evercam gives you remote access from any device, automated time-lapses for client reporting, and legal-grade cloud backups.',
    supportingAsset: 'CCTV vs Construction Camera Comparison Sheet',
  },
  {
    id: 'OBJ-CONNECTIVITY',
    objection: 'Our sites have poor internet connectivity.',
    category: 'technical',
    persona: 'Project Manager',
    response: 'Our solar-powered units include built-in 4G LTE with 72-hour battery backup. No site internet required. We deploy on remote infrastructure projects in rural areas across 20+ countries. We handle connectivity — you just need the camera mounted.',
    supportingAsset: 'Solar Camera Spec Sheet + Remote Site Case Study',
  },
  {
    id: 'OBJ-TIMING',
    objection: 'We\'re too busy to implement new tech right now.',
    category: 'timing',
    persona: 'Champion / Executive Sponsor',
    response: 'Installation takes less than a day with our managed service. You don\'t need to change any workflows — the cameras just start recording. Most PMs tell us they wish they\'d installed cameras on day one. Let us start with your next project kickoff so there\'s zero disruption.',
    supportingAsset: 'Quick Start Guide + 1-Day Deployment Case Study',
  },
  {
    id: 'OBJ-PRIVACY',
    objection: 'What about worker privacy? Our union may object.',
    category: 'internal',
    persona: 'Safety Officer',
    response: 'Evercam is positioned as a safety and progress tool, not surveillance. Our AI detects PPE compliance without identifying individuals. We\'re ISO 27001 certified and SOC 2 compliant. We provide privacy impact assessment templates and have worked with unionized sites across Europe.',
    supportingAsset: 'Privacy Impact Assessment Template + Union Site Case Study',
  },
  {
    id: 'OBJ-INTEGRATION',
    objection: 'Does it work with Procore / Autodesk / our existing stack?',
    category: 'technical',
    persona: 'Technical Evaluator',
    response: 'Yes — we integrate with Procore, Autodesk BIM 360, Bentley iTwin, PlanGrid, and have an open REST API for custom integrations. Our 4D BIM overlay is powered by Bentley, and we support SSO via SAML for enterprise identity management.',
    supportingAsset: 'Integration Matrix + API Documentation',
  },
];

// ---------------------------------------------------------------------------
// Customer References
// ---------------------------------------------------------------------------

export interface CustomerReference {
  id: string;
  company: string;
  industry: string;
  segment: 'SMB' | 'Mid-Market' | 'Enterprise';
  projectType: string;
  camerasDeployed: number;
  productsUsed: string[];
  keyOutcome: string;
  quotable: string;
  contactTitle: string;
  region: string;
}

export const CUSTOMER_REFERENCES: CustomerReference[] = [
  {
    id: 'REF-001',
    company: 'BAM Ireland',
    industry: 'Infrastructure',
    segment: 'Enterprise',
    projectType: 'Hospital PPP',
    camerasDeployed: 12,
    productsUsed: ['PTZ Camera', 'Platform', 'Time-Lapse Pro', 'BIM Integration'],
    keyOutcome: 'Eliminated 3 disputes in first year, saving €180K in legal costs',
    quotable: 'Evercam\'s timestamped footage resolved a subcontractor dispute in 24 hours that would have taken 6 months in court.',
    contactTitle: 'Head of Digital Construction',
    region: 'Ireland',
  },
  {
    id: 'REF-002',
    company: 'Multiplex',
    industry: 'Property Development',
    segment: 'Enterprise',
    projectType: 'Mixed-use high-rise',
    camerasDeployed: 8,
    productsUsed: ['PTZ Camera', 'Solar Camera', 'Platform', 'AI Analytics', 'Time-Lapse Pro'],
    keyOutcome: 'Reduced site visits by 40%, saved 200+ hours of travel time',
    quotable: 'Our PMs can now check 4 sites from their phone before breakfast. That was impossible before Evercam.',
    contactTitle: 'National Operations Manager',
    region: 'Australia',
  },
  {
    id: 'REF-003',
    company: 'Cairn Homes',
    industry: 'Residential Development',
    segment: 'Mid-Market',
    projectType: 'Residential estate (300 units)',
    camerasDeployed: 4,
    productsUsed: ['Fixed Camera', 'Platform', 'Time-Lapse Pro', 'Gate Reporting'],
    keyOutcome: 'Time-lapse videos used in sales center, attributed to 15% faster unit sales',
    quotable: 'Buyers love seeing the time-lapse of their future home being built. It\'s our best marketing asset.',
    contactTitle: 'Marketing Director',
    region: 'Ireland',
  },
  {
    id: 'REF-004',
    company: 'Mercury Engineering',
    industry: 'Data Center Construction',
    segment: 'Enterprise',
    projectType: 'Hyperscale data center',
    camerasDeployed: 20,
    productsUsed: ['PTZ Camera', 'Solar Camera', 'Platform', 'AI Analytics', 'BIM Integration', 'Managed Service'],
    keyOutcome: 'Full audit trail for client (hyperscaler) compliance requirements',
    quotable: 'Our client requires complete visual documentation for every phase. Evercam makes compliance automatic.',
    contactTitle: 'Project Director',
    region: 'Europe',
  },
];
