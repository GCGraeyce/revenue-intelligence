/**
 * Deep Account & Contact Data Model
 *
 * Full entity graph with drill-down: Account → Contacts → Activities → Deal History
 * Every account has realistic profile data, health scoring, engagement history,
 * financial metrics, and linked stakeholders.
 */

import { pipelineDeals, type Deal } from './demo-data.js';

// ---------------------------------------------------------------------------
// Account Entity
// ---------------------------------------------------------------------------

export interface AccountAddress {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
}

export interface AccountEngagement {
  healthScore: number;
  lifetimeValue: number;
  activeDeals: number;
  closedWonDeals: number;
  closedLostDeals: number;
  totalInteractions: number;
  avgResponseTimeHours: number;
  lastInteractionDate: string;
  nps: number | null;
  renewalDate: string | null;
  churnRisk: 'low' | 'medium' | 'high';
  expansionPotential: 'low' | 'medium' | 'high';
}

export interface AccountHistory {
  firstDealDate: string;
  wonDealDates: string[];
  totalCameras: number;
  productBundles: string[];
  projectTypes: string[];
  previousACV: number;
  growthRate: number;
}

// -- Account Status & Lifecycle Enums --
export type AccountStatus = 'prospect' | 'active' | 'churned' | 'dormant' | 'archived';
export type AccountLifecycleStage = 'lead' | 'qualified' | 'customer' | 'advocate' | 'at-risk';
export type PaymentTerms = 'net-30' | 'net-60' | 'net-90' | 'prepaid';

export interface Account {
  id: string;
  name: string;
  legalName: string;
  industry: string;
  subIndustry: string;
  segment: 'SMB' | 'Mid-Market' | 'Enterprise';
  website: string;
  phone: string;
  address: AccountAddress;
  annualRevenue: number;
  employees: number;
  founded: number;
  publiclyTraded: boolean;
  stockTicker?: string;
  // -- Status & Lifecycle --
  status: AccountStatus;
  lifecycleStage: AccountLifecycleStage;
  contractStartDate: string | null;
  contractEndDate: string | null;
  paymentTerms: PaymentTerms;
  billingCurrency: string;
  preferredLanguage: string;
  // -- Hierarchy --
  parentAccountId: string | null;
  subsidiaries: string[];
  // -- Intel --
  competitorPresence: string[];
  technologyStack: string[];
  complianceRequirements: string[];
  // -- Core --
  engagement: AccountEngagement;
  history: AccountHistory;
  tags: string[];
  ownerName: string;
  tier: 'strategic' | 'key' | 'growth' | 'standard';
  icpFit: number;
  // -- Audit --
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  // -- Soft Delete --
  isDeleted: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  // -- Computed --
  daysAsCustomer: number;
  dealVelocityAvg: number;
  netRevenueRetention: number;
}

// ---------------------------------------------------------------------------
// Contact / Stakeholder Entity
// ---------------------------------------------------------------------------

export interface ContactEngagement {
  totalMeetings: number;
  totalEmails: number;
  totalCalls: number;
  lastContactDate: string;
  lastContactType: 'meeting' | 'email' | 'call' | 'linkedin';
  responseRate: number;
  avgResponseTimeHours: number;
  sentiment: 'positive' | 'neutral' | 'negative' | 'unknown';
}

// -- Contact Enums --
export type ContactStatus = 'active' | 'inactive' | 'left-company' | 'do-not-contact';
export type ContactMethod = 'email' | 'phone' | 'linkedin' | 'in-person';
export type DecisionAuthority = 'final-approver' | 'recommender' | 'influencer' | 'gatekeeper' | 'user';
export type MeetingPreference = 'morning' | 'afternoon' | 'evening';

export interface CommunicationHistory {
  channel: 'email' | 'phone' | 'meeting' | 'linkedin';
  quarter: string;
  count: number;
}

export interface Contact {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  mobile?: string;
  linkedin?: string;
  role: 'champion' | 'economic-buyer' | 'technical-evaluator' | 'end-user' | 'blocker' | 'influencer' | 'coach';
  buyerPersona: string;
  influence: 'high' | 'medium' | 'low';
  engagement: ContactEngagement;
  notes: string;
  isPrimary: boolean;
  // -- Status & Preferences --
  status: ContactStatus;
  preferredContactMethod: ContactMethod;
  timezone: string;
  preferredLanguage: string;
  decisionAuthority: DecisionAuthority;
  relationshipStrength: number; // 1-5
  previousCompany: string | null;
  meetingPreference: MeetingPreference;
  // -- Interaction History --
  communicationHistory: CommunicationHistory[];
  lastPositiveInteraction: string | null;
  lastNegativeInteraction: string | null;
  // -- Audit --
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  // -- Soft Delete --
  isDeleted: boolean;
  deletedAt: string | null;
}

// ---------------------------------------------------------------------------
// Activity Records (individual interactions, not aggregates)
// ---------------------------------------------------------------------------

// -- Activity Enums --
export type ActivityStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled';
export type ActivityLocationType = 'virtual' | 'on-site' | 'office';

export interface ActivityLocation {
  type: ActivityLocationType;
  address?: string;
  coordinates?: { lat: number; lng: number };
}

export interface ActivityAttendee {
  contactId: string;
  name: string;
  attended: boolean;
}

export interface LinkedDocument {
  name: string;
  type: 'proposal' | 'contract' | 'presentation' | 'case-study' | 'security-doc' | 'roi-calculator' | 'other';
  url: string;
}

export interface ActivityRecord {
  id: string;
  type: 'meeting' | 'email' | 'call' | 'demo' | 'site-visit' | 'proposal-sent' | 'contract-sent';
  dealId: string;
  accountId: string;
  contactIds: string[];
  subject: string;
  description: string;
  outcome: 'positive' | 'neutral' | 'negative' | 'no-show';
  date: string;
  durationMinutes?: number;
  repName: string;
  nextStep?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  tags: string[];
  // -- Status & Scheduling --
  status: ActivityStatus;
  location: ActivityLocation;
  attendees: ActivityAttendee[];
  // -- Content --
  recordingUrl: string | null;
  transcriptSummary: string | null;
  // -- Follow-up --
  followUpDueDate: string | null;
  followUpCompleted: boolean;
  parentActivityId: string | null;
  linkedDocuments: LinkedDocument[];
  // -- Audit --
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function randInt(min: number, max: number) { return Math.floor(rand(min, max)); }
function pick<T>(arr: readonly T[]): T { return arr[randInt(0, arr.length)]; }
function daysAgo(d: number) { return new Date(Date.now() - d * 86400000).toISOString().slice(0, 10); }

// ---------------------------------------------------------------------------
// Account Profiles (hand-crafted, realistic)
// ---------------------------------------------------------------------------

interface AccountProfile {
  company: string; legalName: string; industry: string; subIndustry: string;
  segment: 'SMB' | 'Mid-Market' | 'Enterprise'; website: string;
  address: AccountAddress; annualRevenue: number; employees: number;
  founded: number; publiclyTraded: boolean; stockTicker?: string;
  tier: 'strategic' | 'key' | 'growth' | 'standard'; tags: string[];
}

const PROFILES: AccountProfile[] = [
  // ── Enterprise ──
  { company: 'BAM Ireland', legalName: 'BAM Building Ltd', industry: 'Infrastructure & Civil Engineering', subIndustry: 'Roads & Bridges', segment: 'Enterprise', website: 'https://www.bamireland.ie', address: { line1: 'Kill, Co. Kildare', city: 'Naas', county: 'Kildare', postcode: 'W91 TX47', country: 'IE' }, annualRevenue: 1_200_000_000, employees: 2500, founded: 1958, publiclyTraded: true, stockTicker: 'BAMNB', tier: 'strategic', tags: ['tier-1-contractor', 'ppp-specialist', 'existing-customer'] },
  { company: 'John Sisk & Son', legalName: 'John Sisk & Son (Holdings) Ltd', industry: 'General Contracting', subIndustry: 'Commercial Build', segment: 'Enterprise', website: 'https://www.johnsiskandson.com', address: { line1: 'Wilton Works, Naas Road', city: 'Dublin', postcode: 'D12 WY07', country: 'IE' }, annualRevenue: 1_800_000_000, employees: 3200, founded: 1859, publiclyTraded: false, tier: 'strategic', tags: ['tier-1-contractor', 'data-centers', 'international'] },
  { company: 'Mercury Engineering', legalName: 'Mercury Engineering Group', industry: 'Data Center Construction', subIndustry: 'Hyperscale', segment: 'Enterprise', website: 'https://www.mercuryeng.com', address: { line1: 'Sandyford', city: 'Dublin', postcode: 'D18 X5K7', country: 'IE' }, annualRevenue: 3_500_000_000, employees: 8000, founded: 1972, publiclyTraded: false, tier: 'strategic', tags: ['data-center-leader', 'hyperscale', 'existing-customer'] },
  { company: 'Cairn Homes', legalName: 'Cairn Homes plc', industry: 'Property Development', subIndustry: 'Residential', segment: 'Enterprise', website: 'https://www.cairnhomes.com', address: { line1: '7 Grand Canal Street Lower', city: 'Dublin', postcode: 'D02 KW81', country: 'IE' }, annualRevenue: 780_000_000, employees: 450, founded: 2014, publiclyTraded: true, stockTicker: 'CRN', tier: 'key', tags: ['property-developer', 'reference-customer'] },
  { company: 'Glenveagh Properties', legalName: 'Glenveagh Properties plc', industry: 'Property Development', subIndustry: 'Residential', segment: 'Enterprise', website: 'https://www.glenveagh.ie', address: { line1: 'Maynooth Business Campus', city: 'Maynooth', postcode: 'W23 F854', country: 'IE' }, annualRevenue: 520_000_000, employees: 380, founded: 2017, publiclyTraded: true, stockTicker: 'GLV', tier: 'key', tags: ['property-developer', 'expansion-target'] },
  { company: 'Skanska', legalName: 'Skanska AB', industry: 'Infrastructure & Civil Engineering', subIndustry: 'Airports', segment: 'Enterprise', website: 'https://www.skanska.com', address: { line1: 'Warfvinges väg 25', city: 'Stockholm', postcode: '112 51', country: 'SE' }, annualRevenue: 18_000_000_000, employees: 28000, founded: 1887, publiclyTraded: true, stockTicker: 'SKA-B', tier: 'strategic', tags: ['tier-1-global', 'sustainability-leader'] },
  { company: 'Multiplex', legalName: 'Multiplex Construction Europe Ltd', industry: 'General Contracting', subIndustry: 'Mixed-Use', segment: 'Enterprise', website: 'https://www.multiplex.global', address: { line1: '1 London Wall Place', city: 'London', postcode: 'EC2Y 5AU', country: 'GB' }, annualRevenue: 4_200_000_000, employees: 5000, founded: 1962, publiclyTraded: false, tier: 'key', tags: ['premium-builder', 'iconic-projects'] },
  { company: "Laing O'Rourke", legalName: "Laing O'Rourke plc", industry: 'Infrastructure & Civil Engineering', subIndustry: 'Rail', segment: 'Enterprise', website: 'https://www.laingorourke.com', address: { line1: 'Bridge Place, Anchor Boulevard', city: 'Dartford', postcode: 'DA2 6SN', country: 'GB' }, annualRevenue: 3_800_000_000, employees: 11000, founded: 1978, publiclyTraded: false, tier: 'strategic', tags: ['dma-leader', 'offsite-construction'] },
  { company: 'VINCI Construction', legalName: 'VINCI Construction SAS', industry: 'Infrastructure & Civil Engineering', subIndustry: 'Roads & Bridges', segment: 'Enterprise', website: 'https://www.vinci-construction.com', address: { line1: '1 cours Ferdinand-de-Lesseps', city: 'Rueil-Malmaison', postcode: '92500', country: 'FR' }, annualRevenue: 52_000_000_000, employees: 272000, founded: 1899, publiclyTraded: true, stockTicker: 'DG', tier: 'strategic', tags: ['global-leader', 'concessions'] },
  { company: 'Jones Engineering', legalName: 'Jones Engineering Group Ltd', industry: 'General Contracting', subIndustry: 'Commercial Build', segment: 'Enterprise', website: 'https://www.joneseng.com', address: { line1: 'Beech Hill, Clonskeagh', city: 'Dublin', postcode: 'D04 A3Y6', country: 'IE' }, annualRevenue: 750_000_000, employees: 3500, founded: 1890, publiclyTraded: false, tier: 'key', tags: ['mep-specialist', 'pharma'] },
  { company: 'Bouygues', legalName: 'Bouygues Construction SA', industry: 'Infrastructure & Civil Engineering', subIndustry: 'Rail', segment: 'Enterprise', website: 'https://www.bouygues-construction.com', address: { line1: '1 Avenue Eugène Freyssinet', city: 'Guyancourt', postcode: '78061', country: 'FR' }, annualRevenue: 36_000_000_000, employees: 200000, founded: 1952, publiclyTraded: true, stockTicker: 'EN', tier: 'strategic', tags: ['global-top-5', 'railway-specialist'] },
  { company: 'Strabag', legalName: 'STRABAG SE', industry: 'Infrastructure & Civil Engineering', subIndustry: 'Roads & Bridges', segment: 'Enterprise', website: 'https://www.strabag.com', address: { line1: 'Donau-City-Straße 9', city: 'Vienna', postcode: '1220', country: 'AT' }, annualRevenue: 17_500_000_000, employees: 74000, founded: 1835, publiclyTraded: true, stockTicker: 'STR', tier: 'key', tags: ['central-europe', 'tunneling'] },
  // ── Mid-Market ──
  { company: 'Bennett Construction', legalName: 'Bennett (Construction) Ltd', industry: 'General Contracting', subIndustry: 'Commercial Build', segment: 'Mid-Market', website: 'https://www.bennettconstruction.ie', address: { line1: '3 Dundrum Business Park', city: 'Dublin', postcode: 'D14 N799', country: 'IE' }, annualRevenue: 280_000_000, employees: 350, founded: 1944, publiclyTraded: false, tier: 'growth', tags: ['retail-specialist', 'repeat-client'] },
  { company: 'John Paul Construction', legalName: 'John Paul Construction Ltd', industry: 'General Contracting', subIndustry: 'Commercial Build', segment: 'Mid-Market', website: 'https://www.johnpaulconstruction.com', address: { line1: 'Park West Business Park', city: 'Dublin', postcode: 'D12 HY65', country: 'IE' }, annualRevenue: 350_000_000, employees: 420, founded: 1968, publiclyTraded: false, tier: 'growth', tags: ['healthcare-specialist', 'ppp'] },
  { company: 'McAleer & Rushe', legalName: 'McAleer & Rushe Ltd', industry: 'General Contracting', subIndustry: 'Commercial Build', segment: 'Mid-Market', website: 'https://www.mcaleer-rushe.co.uk', address: { line1: 'Creagh Road', city: 'Cookstown', postcode: 'BT80 8NN', country: 'GB' }, annualRevenue: 420_000_000, employees: 550, founded: 1975, publiclyTraded: false, tier: 'growth', tags: ['hotel-specialist', 'student-housing'] },
  { company: 'Collen Construction', legalName: 'Collen Construction Ltd', industry: 'General Contracting', subIndustry: 'Commercial Build', segment: 'Mid-Market', website: 'https://www.collenconstruction.ie', address: { line1: 'East Point Business Park', city: 'Dublin', postcode: 'D03 CY66', country: 'IE' }, annualRevenue: 200_000_000, employees: 280, founded: 1810, publiclyTraded: false, tier: 'standard', tags: ['heritage', 'education'] },
  { company: 'Ardmac', legalName: 'Ardmac Ltd', industry: 'Pharmaceutical & Life Sciences', subIndustry: 'Clean Room', segment: 'Mid-Market', website: 'https://www.ardmac.com', address: { line1: 'Airways Industrial Estate', city: 'Dublin', postcode: 'D17 VN83', country: 'IE' }, annualRevenue: 310_000_000, employees: 600, founded: 1977, publiclyTraded: false, tier: 'growth', tags: ['cleanroom-specialist', 'pharma'] },
  { company: 'Designer Group', legalName: 'Designer Group Ltd', industry: 'General Contracting', subIndustry: 'Fit-Out', segment: 'Mid-Market', website: 'https://www.designergroup.ie', address: { line1: 'Calmount Business Park', city: 'Dublin', postcode: 'D12 T4P2', country: 'IE' }, annualRevenue: 240_000_000, employees: 450, founded: 1992, publiclyTraded: false, tier: 'standard', tags: ['mep', 'data-centers'] },
  { company: 'Walls Construction', legalName: 'P.J. Walls Ltd', industry: 'Property Development', subIndustry: 'Residential', segment: 'Mid-Market', website: 'https://www.wallsconstruction.ie', address: { line1: 'Bluebell Business Park', city: 'Dublin', postcode: 'D12 FH90', country: 'IE' }, annualRevenue: 180_000_000, employees: 220, founded: 1976, publiclyTraded: false, tier: 'standard', tags: ['residential', 'commercial'] },
  { company: 'Stewart Construction', legalName: 'Stewart Construction Ltd', industry: 'General Contracting', subIndustry: 'Commercial Build', segment: 'Mid-Market', website: 'https://www.stewartconstruction.ie', address: { line1: 'Industrial Estate', city: 'Tullamore', postcode: 'R35 K9W7', country: 'IE' }, annualRevenue: 220_000_000, employees: 300, founded: 1983, publiclyTraded: false, tier: 'standard', tags: ['education', 'healthcare'] },
  { company: 'Kirby Group Engineering', legalName: 'Kirby Group Engineering Ltd', industry: 'Data Center Construction', subIndustry: 'Hyperscale', segment: 'Mid-Market', website: 'https://www.kirbygroup.com', address: { line1: 'Raheen Business Park', city: 'Limerick', postcode: 'V94 HW05', country: 'IE' }, annualRevenue: 600_000_000, employees: 1800, founded: 1964, publiclyTraded: false, tier: 'growth', tags: ['data-center-mep', 'renewable-energy'] },
  { company: 'Clancy Construction', legalName: 'Clancy Construction Ltd', industry: 'General Contracting', subIndustry: 'Commercial Build', segment: 'Mid-Market', website: 'https://www.clancyconstruction.com', address: { line1: 'Lissywollen', city: 'Athlone', postcode: 'N37 E9K8', country: 'IE' }, annualRevenue: 150_000_000, employees: 200, founded: 1950, publiclyTraded: false, tier: 'standard', tags: ['education', 'midlands'] },
  { company: 'Duggan Brothers', legalName: 'Duggan Brothers (Contractors) Ltd', industry: 'General Contracting', subIndustry: 'Commercial Build', segment: 'Mid-Market', website: 'https://www.dugganbrothers.ie', address: { line1: 'Upperchurch', city: 'Thurles', postcode: 'E41 D3X7', country: 'IE' }, annualRevenue: 160_000_000, employees: 250, founded: 1956, publiclyTraded: false, tier: 'standard', tags: ['healthcare', 'pharma'] },
  { company: 'Priority Construction', legalName: 'Priority Construction Ltd', industry: 'General Contracting', subIndustry: 'Commercial Build', segment: 'Mid-Market', website: 'https://www.priorityconstruction.ie', address: { line1: 'Baldonnell Business Park', city: 'Dublin', postcode: 'D22 FK82', country: 'IE' }, annualRevenue: 130_000_000, employees: 190, founded: 1990, publiclyTraded: false, tier: 'standard', tags: ['commercial', 'industrial'] },
  { company: 'Suir Engineering', legalName: 'Suir Engineering Ltd', industry: 'General Contracting', subIndustry: 'Commercial Build', segment: 'Mid-Market', website: 'https://www.suireng.ie', address: { line1: 'Lisronagh', city: 'Clonmel', postcode: 'E91 NX77', country: 'IE' }, annualRevenue: 180_000_000, employees: 400, founded: 1987, publiclyTraded: false, tier: 'standard', tags: ['electrical-specialist', 'renewable'] },
  // ── SMB ──
  { company: 'Casey Construction', legalName: 'Casey Construction Ltd', industry: 'General Contracting', subIndustry: 'Renovation', segment: 'SMB', website: 'https://www.caseyconstruction.ie', address: { line1: 'Parkmore West', city: 'Galway', postcode: 'H91 RD4C', country: 'IE' }, annualRevenue: 45_000_000, employees: 85, founded: 1998, publiclyTraded: false, tier: 'standard', tags: ['hotel', 'renovation'] },
  { company: 'Townmore Construction', legalName: 'Townmore Construction Ltd', industry: 'Property Development', subIndustry: 'Residential', segment: 'SMB', website: 'https://www.townmore.ie', address: { line1: 'Ballymount Road', city: 'Dublin', postcode: 'D24 DK82', country: 'IE' }, annualRevenue: 80_000_000, employees: 120, founded: 2004, publiclyTraded: false, tier: 'standard', tags: ['social-housing', 'residential'] },
  { company: 'Conack Construction', legalName: 'Conack Construction Ltd', industry: 'General Contracting', subIndustry: 'Commercial Build', segment: 'SMB', website: 'https://www.conack.ie', address: { line1: 'Galway Business Park', city: 'Galway', postcode: 'H91 VK7F', country: 'IE' }, annualRevenue: 35_000_000, employees: 65, founded: 2006, publiclyTraded: false, tier: 'standard', tags: ['warehouse', 'logistics'] },
  { company: 'Modubuild', legalName: 'Modubuild Ltd', industry: 'General Contracting', subIndustry: 'Fit-Out', segment: 'SMB', website: 'https://www.modubuild.com', address: { line1: 'Mountrath Road', city: 'Portlaoise', postcode: 'R32 E5N3', country: 'IE' }, annualRevenue: 120_000_000, employees: 180, founded: 2007, publiclyTraded: false, tier: 'growth', tags: ['modular', 'data-center-fit-out'] },
  { company: 'Vision Contracting', legalName: 'Vision Contracting Ltd', industry: 'General Contracting', subIndustry: 'Fit-Out', segment: 'SMB', website: 'https://www.visioncontracting.ie', address: { line1: 'Cookstown Industrial Estate', city: 'Dublin', postcode: 'D24 NW56', country: 'IE' }, annualRevenue: 55_000_000, employees: 90, founded: 2001, publiclyTraded: false, tier: 'standard', tags: ['office-fit-out', 'retail'] },
  { company: 'Carey Building', legalName: 'P.J. Carey (Contractors) Ltd', industry: 'General Contracting', subIndustry: 'Commercial Build', segment: 'SMB', website: 'https://www.pjcarey.ie', address: { line1: 'Airways Industrial Estate', city: 'Dublin', postcode: 'D17 VN83', country: 'IE' }, annualRevenue: 90_000_000, employees: 140, founded: 1978, publiclyTraded: false, tier: 'standard', tags: ['civil-engineering', 'demolition'] },
  { company: 'Ethos Engineering', legalName: 'Ethos Engineering Ltd', industry: 'Data Center Construction', subIndustry: 'Colocation', segment: 'SMB', website: 'https://www.ethoseng.ie', address: { line1: 'Fitzwilliam Square West', city: 'Dublin', postcode: 'D02 C4P6', country: 'IE' }, annualRevenue: 60_000_000, employees: 100, founded: 2004, publiclyTraded: false, tier: 'growth', tags: ['data-center-consulting', 'sustainability'] },
  { company: 'PM Group', legalName: 'PM Group Global Ltd', industry: 'Pharmaceutical & Life Sciences', subIndustry: 'Manufacturing', segment: 'SMB', website: 'https://www.pmgroup-global.com', address: { line1: 'Belgard Square', city: 'Dublin', postcode: 'D24 HR98', country: 'IE' }, annualRevenue: 500_000_000, employees: 3600, founded: 1973, publiclyTraded: false, tier: 'growth', tags: ['pharma-specialist', 'international'] },
  { company: 'Winthrop Engineering', legalName: 'Winthrop Engineering Ltd', industry: 'General Contracting', subIndustry: 'Commercial Build', segment: 'SMB', website: 'https://www.winthrop.ie', address: { line1: 'Corke Abbey Avenue', city: 'Bray', postcode: 'A98 W8X9', country: 'IE' }, annualRevenue: 95_000_000, employees: 160, founded: 1979, publiclyTraded: false, tier: 'standard', tags: ['mep', 'pharma'] },
];

// ---------------------------------------------------------------------------
// Contact Templates
// ---------------------------------------------------------------------------

interface ContactTemplate {
  firstName: string; lastName: string; title: string; department: string;
  role: Contact['role']; buyerPersona: string; influence: 'high' | 'medium' | 'low';
}

const CONTACT_POOLS: Record<string, ContactTemplate[]> = {
  'BAM Ireland': [
    { firstName: 'Declan', lastName: 'Murphy', title: 'Director of Digital Construction', department: 'Technology', role: 'champion', buyerPersona: 'Technical Evaluator', influence: 'high' },
    { firstName: 'Fiona', lastName: "O'Brien", title: 'Head of Safety & Compliance', department: 'HSEQ', role: 'influencer', buyerPersona: 'Safety Officer', influence: 'high' },
    { firstName: 'Patrick', lastName: 'Maguire', title: 'CFO', department: 'Finance', role: 'economic-buyer', buyerPersona: 'Economic Buyer', influence: 'high' },
    { firstName: 'Siobhan', lastName: 'Kelly', title: 'Project Director - Healthcare', department: 'Operations', role: 'end-user', buyerPersona: 'Project Manager', influence: 'medium' },
    { firstName: 'Brian', lastName: "O'Neill", title: 'IT Security Manager', department: 'IT', role: 'technical-evaluator', buyerPersona: 'Technical Evaluator', influence: 'medium' },
  ],
  'Mercury Engineering': [
    { firstName: 'Sean', lastName: 'Fitzgerald', title: 'VP Engineering', department: 'Engineering', role: 'champion', buyerPersona: 'Executive Sponsor', influence: 'high' },
    { firstName: 'Laura', lastName: 'Brennan', title: 'Data Center Program Director', department: 'Operations', role: 'end-user', buyerPersona: 'Project Manager', influence: 'high' },
    { firstName: 'Derek', lastName: 'Kavanagh', title: 'Group CFO', department: 'Finance', role: 'economic-buyer', buyerPersona: 'Economic Buyer', influence: 'high' },
    { firstName: 'Niamh', lastName: 'Daly', title: 'EHS Director', department: 'HSEQ', role: 'influencer', buyerPersona: 'Safety Officer', influence: 'medium' },
    { firstName: 'Tom', lastName: 'Hickey', title: 'IT Director', department: 'IT', role: 'technical-evaluator', buyerPersona: 'Technical Evaluator', influence: 'medium' },
    { firstName: 'Grace', lastName: 'Murray', title: 'Procurement Manager', department: 'Procurement', role: 'blocker', buyerPersona: 'Economic Buyer', influence: 'medium' },
  ],
  'Cairn Homes': [
    { firstName: 'Michael', lastName: 'Stanley', title: 'CEO', department: 'Executive', role: 'champion', buyerPersona: 'Executive Sponsor', influence: 'high' },
    { firstName: 'Alan', lastName: 'McIntyre', title: 'COO', department: 'Operations', role: 'influencer', buyerPersona: 'Project Manager', influence: 'high' },
    { firstName: 'Shane', lastName: 'Dooley', title: 'CFO', department: 'Finance', role: 'economic-buyer', buyerPersona: 'Economic Buyer', influence: 'high' },
    { firstName: 'Emma', lastName: 'Collins', title: 'Head of Marketing', department: 'Marketing', role: 'end-user', buyerPersona: 'Marketing', influence: 'medium' },
  ],
  'Skanska': [
    { firstName: 'Anders', lastName: 'Lindberg', title: 'Head of Digital Innovation', department: 'Innovation', role: 'champion', buyerPersona: 'Technical Evaluator', influence: 'high' },
    { firstName: 'Karin', lastName: 'Johansson', title: 'VP Operations', department: 'Operations', role: 'influencer', buyerPersona: 'Executive Sponsor', influence: 'high' },
    { firstName: 'Erik', lastName: 'Svensson', title: 'CFO Northern Europe', department: 'Finance', role: 'economic-buyer', buyerPersona: 'Economic Buyer', influence: 'high' },
    { firstName: 'Maria', lastName: 'Bergström', title: 'EHS Manager', department: 'HSEQ', role: 'end-user', buyerPersona: 'Safety Officer', influence: 'medium' },
  ],
  "Laing O'Rourke": [
    { firstName: 'James', lastName: 'Whitworth', title: 'CTO', department: 'Technology', role: 'champion', buyerPersona: 'Technical Evaluator', influence: 'high' },
    { firstName: 'Rebecca', lastName: 'Thornton', title: 'Director of Operations', department: 'Operations', role: 'influencer', buyerPersona: 'Executive Sponsor', influence: 'high' },
    { firstName: 'Mark', lastName: 'Faulkner', title: 'Group Finance Director', department: 'Finance', role: 'economic-buyer', buyerPersona: 'Economic Buyer', influence: 'high' },
  ],
};

const DEFAULT_CONTACTS: ContactTemplate[] = [
  { firstName: 'James', lastName: "O'Reilly", title: 'Managing Director', department: 'Executive', role: 'champion', buyerPersona: 'Executive Sponsor', influence: 'high' },
  { firstName: 'Catherine', lastName: 'Doyle', title: 'Operations Director', department: 'Operations', role: 'end-user', buyerPersona: 'Project Manager', influence: 'high' },
  { firstName: 'David', lastName: 'McCarthy', title: 'Financial Controller', department: 'Finance', role: 'economic-buyer', buyerPersona: 'Economic Buyer', influence: 'medium' },
  { firstName: 'Sarah', lastName: 'Lynch', title: 'Safety Manager', department: 'HSEQ', role: 'influencer', buyerPersona: 'Safety Officer', influence: 'medium' },
];

// ---------------------------------------------------------------------------
// Build Entities
// ---------------------------------------------------------------------------

const COMPETITORS = ['OxBlue', 'EarthCam', 'TrueLook', 'Sensera Systems', 'HoistCam', 'OpticVyu'] as const;
const TECH_STACKS = ['Procore', 'Autodesk BIM 360', 'PlanGrid', 'Aconex', 'Fieldwire', 'Bluebeam Revu', 'Microsoft Project', 'Primavera P6', 'RIB iTWO', 'Trimble Connect'] as const;
const COMPLIANCE_REQS = ['ISO 45001', 'ISO 14001', 'ISO 9001', 'GDPR', 'BS 5975', 'CDM 2015', 'BREEAM', 'LEED', 'CE Marking', 'PCI-DSS'] as const;
const CRM_USERS = ['conor.murphy@evercam.com', 'aoife.kelly@evercam.com', 'sarah.kavanagh@evercam.com', 'system@evercam.com'] as const;

function pickN<T>(arr: readonly T[], min: number, max: number): T[] {
  const n = randInt(min, max + 1);
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function buildAccount(p: AccountProfile, idx: number): Account {
  const accountDeals = pipelineDeals.filter(d => d.company.startsWith(p.company));
  const closedWon = randInt(0, 8);
  const closedLost = randInt(0, 4);
  const ltv = closedWon > 0 ? closedWon * randInt(30000, 300000) : 0;
  const healthScore = Math.min(100, Math.max(10, 50 + (closedWon > 0 ? 15 : 0) + (accountDeals.length > 0 ? 10 : -10) + Math.round(rand(-15, 20))));
  const rep = accountDeals.length > 0 ? accountDeals[0].rep : pick(['Conor Murphy', 'Aoife Kelly', "James O'Sullivan", 'Siobhan Walsh'] as const);

  // Determine status & lifecycle based on deal history
  const isCustomer = closedWon > 0;
  const hasActiveDeals = accountDeals.length > 0;
  const status: AccountStatus = idx === 5 ? 'churned' : idx === 20 ? 'dormant' : idx === 30 ? 'archived'
    : isCustomer ? 'active' : hasActiveDeals ? 'prospect' : 'prospect';
  const lifecycleStage: AccountLifecycleStage = status === 'churned' ? 'at-risk' : status === 'dormant' ? 'at-risk'
    : isCustomer && closedWon >= 3 ? 'advocate' : isCustomer ? 'customer'
    : hasActiveDeals ? 'qualified' : 'lead';

  const createdDaysAgo = randInt(90, 730);
  const contractStartDaysAgo = isCustomer ? randInt(60, 500) : 0;
  const country = p.address.country;
  const currency = country === 'IE' || country === 'FR' || country === 'AT' ? 'EUR'
    : country === 'GB' ? 'GBP' : country === 'SE' ? 'SEK' : 'EUR';
  const language = country === 'FR' ? 'fr' : country === 'SE' ? 'sv' : country === 'DE' || country === 'AT' ? 'de'
    : country === 'NL' ? 'nl' : 'en';

  // Parent/subsidiary hierarchy — VINCI owns Bouygues-like firms, etc.
  const parentAccountId = idx === 10 ? 'ACC-0009' : idx === 11 ? 'ACC-0009' : null; // Bouygues & Strabag under VINCI conceptually
  const subsidiaries = idx === 8 ? ['ACC-0010', 'ACC-0011'] : []; // VINCI has subsidiaries

  return {
    id: `ACC-${String(idx + 1).padStart(4, '0')}`,
    name: p.company, legalName: p.legalName, industry: p.industry, subIndustry: p.subIndustry,
    segment: p.segment, website: p.website, phone: `+353-1-${randInt(200, 999)}-${randInt(1000, 9999)}`,
    address: p.address, annualRevenue: p.annualRevenue, employees: p.employees,
    founded: p.founded, publiclyTraded: p.publiclyTraded, stockTicker: p.stockTicker,
    // Status & Lifecycle
    status,
    lifecycleStage,
    contractStartDate: isCustomer ? daysAgo(contractStartDaysAgo) : null,
    contractEndDate: isCustomer ? daysAgo(-randInt(30, 365)) : null,
    paymentTerms: p.segment === 'Enterprise' ? 'net-60' : p.segment === 'Mid-Market' ? 'net-30' : 'prepaid',
    billingCurrency: currency,
    preferredLanguage: language,
    // Hierarchy
    parentAccountId,
    subsidiaries,
    // Intel
    competitorPresence: pickN(COMPETITORS, 0, 3),
    technologyStack: pickN(TECH_STACKS, 1, 5),
    complianceRequirements: pickN(COMPLIANCE_REQS, 1, 4),
    // Core
    engagement: {
      healthScore, lifetimeValue: ltv, activeDeals: accountDeals.length,
      closedWonDeals: closedWon, closedLostDeals: closedLost,
      totalInteractions: accountDeals.reduce((s, d) => s + d.activities.meetings + d.activities.emails + d.activities.calls, 0) + randInt(10, 50),
      avgResponseTimeHours: +(rand(1, 48)).toFixed(1),
      lastInteractionDate: daysAgo(randInt(0, 14)),
      nps: closedWon > 0 ? randInt(20, 90) : null,
      renewalDate: closedWon > 0 ? daysAgo(-randInt(30, 365)) : null,
      churnRisk: healthScore > 70 ? 'low' : healthScore > 40 ? 'medium' : 'high',
      expansionPotential: p.segment === 'Enterprise' ? 'high' : p.segment === 'Mid-Market' ? 'medium' : 'low',
    },
    history: {
      firstDealDate: closedWon > 0 ? daysAgo(randInt(180, 730)) : daysAgo(randInt(30, 365)),
      wonDealDates: Array.from({ length: closedWon }, (_, i) => daysAgo(randInt(30 + i * 60, 90 + i * 90))),
      totalCameras: closedWon > 0 ? closedWon * randInt(2, 12) : 0,
      productBundles: closedWon > 0 ? [...new Set(Array.from({ length: closedWon }, () => pick(['Site Starter', 'Project Pro', 'Safety & Compliance', 'Enterprise Visibility'] as const)))] : [],
      projectTypes: [...new Set(accountDeals.map(d => d.projectType).slice(0, 3))],
      previousACV: closedWon > 0 ? randInt(15000, 200000) : 0,
      growthRate: closedWon > 0 ? +(rand(-10, 45)).toFixed(1) : 0,
    },
    tags: p.tags, ownerName: rep, tier: p.tier,
    icpFit: Math.round(p.segment === 'Enterprise' ? rand(65, 98) : p.segment === 'Mid-Market' ? rand(45, 88) : rand(30, 72)),
    // Audit
    createdAt: daysAgo(createdDaysAgo),
    updatedAt: daysAgo(randInt(0, 14)),
    createdBy: pick(CRM_USERS),
    updatedBy: pick(CRM_USERS),
    // Soft Delete
    isDeleted: status === 'archived',
    deletedAt: status === 'archived' ? daysAgo(randInt(5, 30)) : null,
    deletedBy: status === 'archived' ? pick(CRM_USERS) : null,
    // Computed
    daysAsCustomer: isCustomer ? contractStartDaysAgo : 0,
    dealVelocityAvg: accountDeals.length > 0 ? Math.round(accountDeals.reduce((s, d) => s + d.daysInStage, 0) / accountDeals.length) : 0,
    netRevenueRetention: isCustomer ? +(rand(0.85, 1.35)).toFixed(2) : 0,
  };
}

const TIMEZONES = ['Europe/Dublin', 'Europe/London', 'Europe/Paris', 'Europe/Stockholm', 'Europe/Vienna', 'Europe/Amsterdam'] as const;
const PREVIOUS_COMPANIES = [null, null, null, 'Arup', 'WSP', 'Jacobs Engineering', 'Turner & Townsend', 'AECOM', 'Mott MacDonald', 'Arcadis', 'DPS Group', 'Kent', null] as const;

function buildContacts(account: Account, templates: ContactTemplate[]): Contact[] {
  return templates.map((t, i) => {
    const isLeftCompany = i === templates.length - 1 && Math.random() > 0.85; // ~15% chance last contact has left
    const isDoNotContact = !isLeftCompany && i === templates.length - 1 && Math.random() > 0.92;
    const contactStatus: ContactStatus = isLeftCompany ? 'left-company' : isDoNotContact ? 'do-not-contact'
      : Math.random() > 0.12 ? 'active' : 'inactive';

    const roleToAuthority: Record<string, DecisionAuthority> = {
      champion: 'recommender', 'economic-buyer': 'final-approver', 'technical-evaluator': 'recommender',
      'end-user': 'user', blocker: 'gatekeeper', influencer: 'influencer', coach: 'recommender',
    };

    const lastPositive = t.role === 'champion' ? daysAgo(randInt(1, 14)) : Math.random() > 0.3 ? daysAgo(randInt(3, 60)) : null;
    const lastNegative = t.role === 'blocker' ? daysAgo(randInt(5, 30)) : Math.random() > 0.8 ? daysAgo(randInt(10, 90)) : null;

    const quarters = ['Q3 FY25', 'Q4 FY25', 'Q1 FY26'];
    const channels = ['email', 'phone', 'meeting', 'linkedin'] as const;
    const commHistory: CommunicationHistory[] = quarters.flatMap(q =>
      channels.map(ch => ({ channel: ch, quarter: q, count: randInt(0, ch === 'email' ? 12 : ch === 'meeting' ? 4 : 6) }))
    );

    const createdDaysAgo = randInt(30, 365);

    return {
      id: `CON-${account.id.slice(4)}-${String(i + 1).padStart(2, '0')}`,
      accountId: account.id, firstName: t.firstName, lastName: t.lastName,
      fullName: `${t.firstName} ${t.lastName}`, title: t.title, department: t.department,
      email: `${t.firstName.toLowerCase()}.${t.lastName.toLowerCase().replace(/'/g, '')}@${account.website.replace('https://www.', '')}`,
      phone: `+353-${randInt(80, 89)}-${randInt(100, 999)}-${randInt(1000, 9999)}`,
      mobile: Math.random() > 0.3 ? `+353-${randInt(80, 89)}-${randInt(100, 999)}-${randInt(1000, 9999)}` : undefined,
      linkedin: Math.random() > 0.2 ? `https://linkedin.com/in/${t.firstName.toLowerCase()}${t.lastName.toLowerCase().replace(/'/g, '')}` : undefined,
      role: t.role, buyerPersona: t.buyerPersona, influence: t.influence,
      engagement: {
        totalMeetings: randInt(1, 12), totalEmails: randInt(3, 35), totalCalls: randInt(1, 15),
        lastContactDate: daysAgo(randInt(0, 30)),
        lastContactType: pick(['meeting', 'email', 'call', 'linkedin'] as const),
        responseRate: +(rand(0.3, 0.95)).toFixed(2),
        avgResponseTimeHours: +(rand(1, 72)).toFixed(1),
        sentiment: t.role === 'blocker' ? 'negative' : t.role === 'champion' ? 'positive' : pick(['positive', 'neutral', 'neutral'] as const),
      },
      notes: t.role === 'champion' ? 'Strong internal advocate. Has used Evercam previously and actively promotes the solution.'
        : t.role === 'economic-buyer' ? 'Focused on ROI and total cost of ownership. Needs clear business case before sign-off.'
        : t.role === 'blocker' ? 'Prefers incumbent vendor. Concerned about switching costs and integration complexity.'
        : 'Engaged in evaluation process. Responsive to technical demonstrations.',
      isPrimary: i === 0,
      // Status & Preferences
      status: contactStatus,
      preferredContactMethod: pick(['email', 'email', 'phone', 'linkedin', 'in-person'] as const),
      timezone: pick(TIMEZONES),
      preferredLanguage: account.preferredLanguage,
      decisionAuthority: roleToAuthority[t.role] || 'user',
      relationshipStrength: t.role === 'champion' ? randInt(4, 6) : t.role === 'blocker' ? randInt(1, 3) : randInt(2, 5),
      previousCompany: isLeftCompany ? pick(['Arup', 'WSP', 'Jacobs', 'AECOM'] as const) : pick(PREVIOUS_COMPANIES),
      meetingPreference: pick(['morning', 'afternoon', 'afternoon', 'evening'] as const),
      // Interaction History
      communicationHistory: commHistory,
      lastPositiveInteraction: lastPositive,
      lastNegativeInteraction: lastNegative,
      // Audit
      createdAt: daysAgo(createdDaysAgo),
      updatedAt: daysAgo(randInt(0, 14)),
      createdBy: pick(CRM_USERS),
      // Soft Delete
      isDeleted: contactStatus === 'left-company' && Math.random() > 0.5,
      deletedAt: contactStatus === 'left-company' && Math.random() > 0.5 ? daysAgo(randInt(5, 60)) : null,
    };
  });
}

const ACTIVITY_SUBJECTS: Record<string, string[]> = {
  meeting: ['Discovery call - Site monitoring requirements', 'Demo session - AI analytics platform', 'Proposal review meeting', 'Stakeholder alignment call', 'Technical architecture review', 'Contract negotiation meeting', 'Quarterly business review', 'Executive briefing'],
  email: ['RE: Evercam proposal for site monitoring', 'Camera placement recommendations', 'Case study: BAM Ireland reduced disputes by 40%', 'Updated pricing - Multi-site discount', 'Security documentation (ISO 27001)', 'ROI calculator with your project data', 'Next steps after demo', 'Site survey scheduling'],
  call: ['Check-in call - Deal progress', 'Champion sync - Internal positioning', 'Objection handling - CCTV vs Evercam', 'Budget approval follow-up', 'Competitive intel - OxBlue pricing', 'Technical clarification - Solar camera'],
  demo: ['Live platform demo - AI analytics', 'Site-specific demo with client footage', 'Safety compliance demo for EHS team', 'BIM integration demo with Procore'],
  'site-visit': ['Site survey - Camera placement assessment', 'On-site pilot review', 'Multi-site walkthrough'],
};

const ACTIVITY_DESCRIPTIONS: Record<string, string[]> = {
  meeting: ['Discussed current site monitoring gaps. Client showed strong interest in time-lapse and safety analytics.', 'Walked through live demo on construction site footage. PM was impressed by AI incident detection.', 'Reviewed proposal with project team. Key feedback on pricing and deployment timeline.', 'Multi-stakeholder call to align on evaluation criteria. CFO joined for budget discussion.'],
  email: ['Sent tailored proposal with camera placement diagram. Awaiting feedback from PM.', 'Shared camera placement recommendations based on site survey. Client to review with site manager.', 'Forwarded BAM Ireland case study highlighting dispute resolution ROI.', 'Sent updated pricing with 15% multi-site discount. Valid for 30 days.'],
  call: ['Quick check-in on deal progress. Client confirmed internal meeting scheduled for next week.', 'Synced with champion on how to position Evercam internally. Provided talking points vs incumbent.', 'Addressed objection about using existing CCTV. Explained construction-specific vs security-grade differences.', 'Followed up on budget approval. CFO needs one more week for capex review.'],
  demo: ['Full platform demo showcasing AI-powered incident detection, time-lapse, and stakeholder reporting.', 'Used client footage to demonstrate camera placement value. High engagement from PM.', 'Demonstrated safety compliance features to EHS team. Focus on automated PPE detection.'],
  'site-visit': ['Conducted physical site survey. Identified 6 optimal camera positions covering entry, crane zone, material storage.', 'Reviewed pilot camera installation. Client confirmed image quality meets requirements.'],
};

const NEXT_STEPS = ['Schedule follow-up demo with CFO', 'Send updated proposal by EOW', 'Arrange reference call with Cairn Homes', 'Share security documentation', 'Book site survey for next week', 'Send ROI calculator with project data', 'Schedule stakeholder alignment call'];

const TRANSCRIPT_SUMMARIES = [
  'Discussed project monitoring requirements. Client confirmed 3 active construction sites needing coverage. Key concern: night-time security and weather-resistant cameras.',
  'Walkthrough of AI analytics platform. PM impressed by automated progress tracking. EHS lead asked about PPE detection accuracy. Action: send accuracy benchmarks.',
  'Proposal review with project team. CFO raised budget timing concerns — capex approval in 2 weeks. Champion to present ROI case internally.',
  'Competitive comparison discussed. Client currently using OxBlue on one site. Evercam advantages: AI analytics, solar-powered cameras, BIM integration.',
  'Technical deep-dive on API integration with Procore. IT team satisfied with SSO support. Remaining concern: data residency for EU projects.',
  'Quarterly review with existing customer. 40% reduction in site disputes attributed to time-lapse evidence. Client keen to expand to 2 additional sites.',
  null, null, null, null, // Most activities don't have transcripts
];

const LINKED_DOC_TEMPLATES: LinkedDocument[][] = [
  [{ name: 'Evercam Enterprise Proposal', type: 'proposal', url: '/docs/proposals/evercam-enterprise-v3.pdf' }],
  [{ name: 'ROI Calculator - Construction Monitoring', type: 'roi-calculator', url: '/docs/roi/construction-monitoring.xlsx' }],
  [{ name: 'ISO 27001 Security Documentation', type: 'security-doc', url: '/docs/security/iso27001-cert.pdf' }],
  [{ name: 'BAM Ireland Case Study', type: 'case-study', url: '/docs/case-studies/bam-ireland.pdf' }],
  [{ name: 'Camera Placement Guide', type: 'presentation', url: '/docs/guides/camera-placement.pptx' }],
  [],
  [],
];

function buildActivities(account: Account, contacts: Contact[], deals: Deal[]): ActivityRecord[] {
  const activities: ActivityRecord[] = [];
  const types = ['meeting', 'email', 'call', 'demo', 'site-visit'] as const;
  const numActivities = randInt(8, 25);

  for (let i = 0; i < numActivities; i++) {
    const type = pick(types);
    const subjects = ACTIVITY_SUBJECTS[type] || ACTIVITY_SUBJECTS.meeting;
    const descs = ACTIVITY_DESCRIPTIONS[type] || ACTIVITY_DESCRIPTIONS.meeting;
    const dealRef = deals.length > 0 ? pick(deals) : null;
    const contactRefs = contacts.length > 0
      ? contacts.filter(() => Math.random() > 0.5).slice(0, 3).map(c => c.id)
      : [];
    if (contactRefs.length === 0 && contacts.length > 0) contactRefs.push(contacts[0].id);

    const actDate = daysAgo(randInt(0, 120));
    const isFuture = new Date(actDate) > new Date();
    const outcomeVal = pick(['positive', 'positive', 'positive', 'neutral', 'neutral', 'negative'] as const);
    // Edge cases: no-show, cancelled, rescheduled
    const statusRoll = Math.random();
    const actStatus: ActivityStatus = isFuture ? 'scheduled'
      : statusRoll > 0.95 ? 'no-show'
      : statusRoll > 0.90 ? 'cancelled'
      : statusRoll > 0.85 ? 'rescheduled'
      : 'completed';

    const attendees: ActivityAttendee[] = contactRefs.map(cid => {
      const c = contacts.find(ct => ct.id === cid);
      return {
        contactId: cid,
        name: c?.fullName || 'Unknown',
        attended: actStatus === 'no-show' ? Math.random() > 0.7 : actStatus !== 'cancelled',
      };
    });

    const locationType: ActivityLocationType = type === 'site-visit' ? 'on-site'
      : type === 'meeting' || type === 'demo' ? pick(['virtual', 'virtual', 'office'] as const)
      : 'virtual';

    const followUpDate = Math.random() > 0.4 ? daysAgo(-randInt(1, 14)) : null;
    const parentId = i > 0 && Math.random() > 0.8
      ? `ACT-${account.id.slice(4)}-${String(randInt(1, i)).padStart(3, '0')}`
      : null;

    const createdDaysAgo = randInt(0, 130);

    activities.push({
      id: `ACT-${account.id.slice(4)}-${String(i + 1).padStart(3, '0')}`,
      type, dealId: dealRef?.id || '', accountId: account.id, contactIds: contactRefs,
      subject: pick(subjects), description: pick(descs),
      outcome: outcomeVal,
      date: actDate,
      durationMinutes: type === 'meeting' ? randInt(30, 90) : type === 'demo' ? randInt(45, 120) : type === 'site-visit' ? randInt(120, 480) : undefined,
      repName: account.ownerName,
      nextStep: Math.random() > 0.3 ? pick(NEXT_STEPS) : undefined,
      sentiment: pick(['positive', 'positive', 'neutral', 'neutral', 'negative'] as const),
      tags: [type, account.segment.toLowerCase()],
      // Status & Scheduling
      status: actStatus,
      location: {
        type: locationType,
        address: locationType === 'on-site' ? `${account.address.line1}, ${account.address.city}` : locationType === 'office' ? 'Evercam HQ, Dublin' : undefined,
        coordinates: locationType === 'on-site' ? { lat: 53.3498 + rand(-0.5, 0.5), lng: -6.2603 + rand(-0.5, 0.5) } : undefined,
      },
      attendees,
      // Content
      recordingUrl: (type === 'meeting' || type === 'demo') && actStatus === 'completed' && Math.random() > 0.6 ? `/recordings/${account.id.slice(4)}-${i + 1}.mp4` : null,
      transcriptSummary: (type === 'meeting' || type === 'demo') && actStatus === 'completed' ? pick(TRANSCRIPT_SUMMARIES) : null,
      // Follow-up
      followUpDueDate: followUpDate,
      followUpCompleted: followUpDate ? Math.random() > 0.4 : false,
      parentActivityId: parentId,
      linkedDocuments: Math.random() > 0.6 ? pick(LINKED_DOC_TEMPLATES) : [],
      // Audit
      createdAt: daysAgo(createdDaysAgo),
      updatedAt: daysAgo(randInt(0, Math.min(createdDaysAgo, 14))),
      createdBy: pick(CRM_USERS),
    });
  }
  return activities.sort((a, b) => b.date.localeCompare(a.date));
}

// ---------------------------------------------------------------------------
// Generate All Entities
// ---------------------------------------------------------------------------

export const accounts: Account[] = PROFILES.map((p, i) => buildAccount(p, i));

export const contacts: Contact[] = accounts.flatMap(account => {
  const templates = CONTACT_POOLS[account.name] || DEFAULT_CONTACTS;
  return buildContacts(account, templates);
});

export const activityRecords: ActivityRecord[] = accounts.flatMap(account => {
  const accountContacts = contacts.filter(c => c.accountId === account.id);
  const accountDeals = pipelineDeals.filter(d => d.company.startsWith(account.name));
  return buildActivities(account, accountContacts, accountDeals);
});

// ---------------------------------------------------------------------------
// Lookup Functions (Drill-Down API)
// ---------------------------------------------------------------------------

export function getAccountByName(name: string): Account | undefined {
  return accounts.find(a => name.startsWith(a.name) || a.name === name);
}

export function getAccountById(id: string): Account | undefined {
  return accounts.find(a => a.id === id);
}

export function getContactsForAccount(accountId: string): Contact[] {
  return contacts.filter(c => c.accountId === accountId);
}

export function getContactById(id: string): Contact | undefined {
  return contacts.find(c => c.id === id);
}

export function getActivitiesForAccount(accountId: string): ActivityRecord[] {
  return activityRecords.filter(a => a.accountId === accountId);
}

export function getActivitiesForDeal(dealId: string): ActivityRecord[] {
  return activityRecords.filter(a => a.dealId === dealId);
}

export function getActivitiesForContact(contactId: string): ActivityRecord[] {
  return activityRecords.filter(a => a.contactIds.includes(contactId));
}

/** Full drill-down: account + contacts + activities + deals */
export function getAccountFull(accountId: string) {
  const account = getAccountById(accountId);
  if (!account) return null;
  const ac = getContactsForAccount(accountId);
  const aa = getActivitiesForAccount(accountId);
  const ad = pipelineDeals.filter(d => d.company.startsWith(account.name));
  return {
    account, contacts: ac, activities: aa, deals: ad,
    summary: {
      totalContacts: ac.length, totalActivities: aa.length, totalDeals: ad.length,
      totalPipelineACV: ad.reduce((s, d) => s + d.acv, 0),
      avgPQS: ad.length ? Math.round(ad.reduce((s, d) => s + d.pqScore, 0) / ad.length) : 0,
      championIdentified: ac.some(c => c.role === 'champion'),
      economicBuyerIdentified: ac.some(c => c.role === 'economic-buyer'),
      stakeholderCoverage: Math.round((ac.filter(c => c.status === 'active').length / Math.max(ac.length, 1)) * 100),
      recentActivityCount: aa.filter(a => new Date(a.date) >= new Date(Date.now() - 14 * 86400000)).length,
    },
  };
}

/** Full drill-down from deal → account → contacts → activities */
export function getDealFull(dealId: string) {
  const deal = pipelineDeals.find(d => d.id === dealId);
  if (!deal) return null;
  const account = getAccountByName(deal.company);
  const dc = account ? getContactsForAccount(account.id) : [];
  const da = getActivitiesForDeal(dealId);
  return {
    deal, account: account || null, contacts: dc, activities: da,
    stakeholderMap: {
      champion: dc.find(c => c.role === 'champion') || null,
      economicBuyer: dc.find(c => c.role === 'economic-buyer') || null,
      technicalEvaluator: dc.find(c => c.role === 'technical-evaluator') || null,
      endUsers: dc.filter(c => c.role === 'end-user'),
      blockers: dc.filter(c => c.role === 'blocker'),
      influencers: dc.filter(c => c.role === 'influencer'),
    },
  };
}
