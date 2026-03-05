/**
 * Company Repository — Master Data
 *
 * Centralised reference data for deal types, countries, channel partners,
 * industries, and company metadata used across the Revenue Intelligence platform.
 */

// ---------------------------------------------------------------------------
// Deal Types
// ---------------------------------------------------------------------------

export interface DealType {
  id: string;
  name: string;
  description: string;
  typicalACV: { min: number; max: number };
  typicalCycle: { minDays: number; maxDays: number };
  requiredProducts: string[];
}

export const DEAL_TYPES: DealType[] = [
  {
    id: 'new-logo',
    name: 'New Logo',
    description: 'First-time customer acquisition. Full sales cycle from discovery to close.',
    typicalACV: { min: 15000, max: 500000 },
    typicalCycle: { minDays: 30, maxDays: 120 },
    requiredProducts: ['Platform'],
  },
  {
    id: 'expansion',
    name: 'Expansion',
    description: 'Existing customer adding cameras, sites, or products. Shorter cycle, higher win rate.',
    typicalACV: { min: 10000, max: 200000 },
    typicalCycle: { minDays: 14, maxDays: 45 },
    requiredProducts: [],
  },
  {
    id: 'renewal',
    name: 'Renewal',
    description: 'Annual contract renewal. Focus on retention, upsell, and health score.',
    typicalACV: { min: 5000, max: 300000 },
    typicalCycle: { minDays: 30, maxDays: 90 },
    requiredProducts: [],
  },
  {
    id: 'upgrade',
    name: 'Product Upgrade',
    description: 'Customer upgrading from Starter/Professional to Enterprise or Managed Service.',
    typicalACV: { min: 20000, max: 150000 },
    typicalCycle: { minDays: 14, maxDays: 60 },
    requiredProducts: [],
  },
  {
    id: 'project-based',
    name: 'Project-Based',
    description: 'Time-limited deployment for a specific construction project. May convert to recurring.',
    typicalACV: { min: 5000, max: 80000 },
    typicalCycle: { minDays: 7, maxDays: 30 },
    requiredProducts: ['Platform'],
  },
  {
    id: 'partner-referred',
    name: 'Partner Referred',
    description: 'Deal sourced through channel partner. Partner manages relationship, Evercam provides product.',
    typicalACV: { min: 10000, max: 250000 },
    typicalCycle: { minDays: 21, maxDays: 90 },
    requiredProducts: ['Platform'],
  },
];

// ---------------------------------------------------------------------------
// Countries & Regions
// ---------------------------------------------------------------------------

export interface Country {
  code: string;
  name: string;
  region: string;
  currency: string;
  timezone: string;
  marketMaturity: 'established' | 'growing' | 'emerging';
  activeDeals?: number;
}

export const COUNTRIES: Country[] = [
  { code: 'IE', name: 'Ireland', region: 'Europe', currency: 'EUR', timezone: 'GMT', marketMaturity: 'established' },
  { code: 'GB', name: 'United Kingdom', region: 'Europe', currency: 'GBP', timezone: 'GMT', marketMaturity: 'established' },
  { code: 'DE', name: 'Germany', region: 'Europe', currency: 'EUR', timezone: 'CET', marketMaturity: 'growing' },
  { code: 'FR', name: 'France', region: 'Europe', currency: 'EUR', timezone: 'CET', marketMaturity: 'growing' },
  { code: 'NL', name: 'Netherlands', region: 'Europe', currency: 'EUR', timezone: 'CET', marketMaturity: 'growing' },
  { code: 'AU', name: 'Australia', region: 'APAC', currency: 'AUD', timezone: 'AEST', marketMaturity: 'established' },
  { code: 'NZ', name: 'New Zealand', region: 'APAC', currency: 'NZD', timezone: 'NZST', marketMaturity: 'growing' },
  { code: 'US', name: 'United States', region: 'Americas', currency: 'USD', timezone: 'EST', marketMaturity: 'growing' },
  { code: 'CA', name: 'Canada', region: 'Americas', currency: 'CAD', timezone: 'EST', marketMaturity: 'emerging' },
  { code: 'AE', name: 'UAE', region: 'Middle East', currency: 'AED', timezone: 'GST', marketMaturity: 'growing' },
  { code: 'SA', name: 'Saudi Arabia', region: 'Middle East', currency: 'SAR', timezone: 'AST', marketMaturity: 'emerging' },
  { code: 'SG', name: 'Singapore', region: 'APAC', currency: 'SGD', timezone: 'SGT', marketMaturity: 'emerging' },
];

export const REGIONS = [...new Set(COUNTRIES.map(c => c.region))];

// ---------------------------------------------------------------------------
// Channel Partners
// ---------------------------------------------------------------------------

export interface ChannelPartner {
  id: string;
  name: string;
  type: 'reseller' | 'referral' | 'system-integrator' | 'technology-partner';
  region: string;
  tier: 'platinum' | 'gold' | 'silver';
  specialisation: string;
  dealCount: number;
  totalRevenue: number;
  avgDealSize: number;
  winRate: number;
  status: 'active' | 'onboarding' | 'inactive';
}

export const CHANNEL_PARTNERS: ChannelPartner[] = [
  {
    id: 'CP-001',
    name: 'BuildTech Solutions',
    type: 'reseller',
    region: 'Europe',
    tier: 'platinum',
    specialisation: 'Construction technology integration',
    dealCount: 42,
    totalRevenue: 1850000,
    avgDealSize: 44047,
    winRate: 0.52,
    status: 'active',
  },
  {
    id: 'CP-002',
    name: 'Procore Ireland',
    type: 'technology-partner',
    region: 'Europe',
    tier: 'platinum',
    specialisation: 'Construction management platform integration',
    dealCount: 28,
    totalRevenue: 980000,
    avgDealSize: 35000,
    winRate: 0.61,
    status: 'active',
  },
  {
    id: 'CP-003',
    name: 'Digital Construction Group',
    type: 'system-integrator',
    region: 'APAC',
    tier: 'gold',
    specialisation: 'BIM and digital twin implementation',
    dealCount: 18,
    totalRevenue: 720000,
    avgDealSize: 40000,
    winRate: 0.48,
    status: 'active',
  },
  {
    id: 'CP-004',
    name: 'SafeSite Technologies',
    type: 'referral',
    region: 'Europe',
    tier: 'gold',
    specialisation: 'Construction safety compliance',
    dealCount: 15,
    totalRevenue: 380000,
    avgDealSize: 25333,
    winRate: 0.45,
    status: 'active',
  },
  {
    id: 'CP-005',
    name: 'Gulf Construction Tech',
    type: 'reseller',
    region: 'Middle East',
    tier: 'silver',
    specialisation: 'Infrastructure monitoring in GCC region',
    dealCount: 8,
    totalRevenue: 420000,
    avgDealSize: 52500,
    winRate: 0.38,
    status: 'onboarding',
  },
  {
    id: 'CP-006',
    name: 'Bentley Systems',
    type: 'technology-partner',
    region: 'Global',
    tier: 'platinum',
    specialisation: 'BIM and infrastructure digital twin (iTwin)',
    dealCount: 12,
    totalRevenue: 680000,
    avgDealSize: 56666,
    winRate: 0.58,
    status: 'active',
  },
];

// ---------------------------------------------------------------------------
// Industries
// ---------------------------------------------------------------------------

export interface Industry {
  id: string;
  name: string;
  subSegments: string[];
  typicalProjectTypes: string[];
  avgCameras: number;
  avgACV: number;
}

export const INDUSTRIES: Industry[] = [
  {
    id: 'IND-INFRA',
    name: 'Infrastructure & Civil Engineering',
    subSegments: ['Roads & Bridges', 'Rail', 'Airports', 'Water Treatment', 'Energy'],
    typicalProjectTypes: ['Highway construction', 'Bridge build', 'Rail extension', 'Airport terminal'],
    avgCameras: 12,
    avgACV: 180000,
  },
  {
    id: 'IND-PROPDEV',
    name: 'Property Development',
    subSegments: ['Residential', 'Commercial', 'Mixed-Use', 'Student Housing'],
    typicalProjectTypes: ['Residential estate', 'Office complex', 'Mixed-use high-rise', 'Student accommodation'],
    avgCameras: 6,
    avgACV: 85000,
  },
  {
    id: 'IND-DATACENTER',
    name: 'Data Center Construction',
    subSegments: ['Hyperscale', 'Colocation', 'Edge'],
    typicalProjectTypes: ['Hyperscale campus', 'Colocation facility', 'Edge data center'],
    avgCameras: 20,
    avgACV: 250000,
  },
  {
    id: 'IND-PHARMA',
    name: 'Pharmaceutical & Life Sciences',
    subSegments: ['Manufacturing', 'R&D Facilities', 'Clean Room'],
    typicalProjectTypes: ['Pharma manufacturing', 'Lab facility', 'Clean room build'],
    avgCameras: 15,
    avgACV: 200000,
  },
  {
    id: 'IND-GENERAL',
    name: 'General Contracting',
    subSegments: ['Commercial Build', 'Renovation', 'Fit-Out'],
    typicalProjectTypes: ['Commercial build', 'Office renovation', 'Retail fit-out'],
    avgCameras: 4,
    avgACV: 35000,
  },
  {
    id: 'IND-MINING',
    name: 'Mining & Resources',
    subSegments: ['Open Pit', 'Underground', 'Processing'],
    typicalProjectTypes: ['Mine site monitoring', 'Processing plant', 'Tailings management'],
    avgCameras: 8,
    avgACV: 120000,
  },
];

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

export function getDealTypeById(id: string): DealType | undefined {
  return DEAL_TYPES.find(dt => dt.id === id);
}

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

export function getCountriesByRegion(region: string): Country[] {
  return COUNTRIES.filter(c => c.region === region);
}

export function getPartnersByTier(tier: ChannelPartner['tier']): ChannelPartner[] {
  return CHANNEL_PARTNERS.filter(p => p.tier === tier);
}

export function getPartnerById(id: string): ChannelPartner | undefined {
  return CHANNEL_PARTNERS.find(p => p.id === id);
}

export function getPartnersByRegion(region: string): ChannelPartner[] {
  return CHANNEL_PARTNERS.filter(p => p.region === region || p.region === 'Global');
}
