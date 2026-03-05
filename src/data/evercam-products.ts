/**
 * Evercam Product Catalog
 *
 * Defines all Evercam hardware and software products, features,
 * and SKU-level detail for CRM deal configuration.
 *
 * Source: evercam.io / evercam.com public product pages
 * Mock pricing based on market research ($500+/user/mo baseline)
 */

// ---------------------------------------------------------------------------
// Product Types
// ---------------------------------------------------------------------------

export type ProductCategory = 'hardware' | 'software' | 'addon' | 'service';
export type BillingCycle = 'monthly' | 'annual' | 'one-time' | 'per-project';
export type CameraType = 'fixed' | 'ptz' | 'solar' | 'weather-station';

export interface EvercamProduct {
  sku: string;
  name: string;
  category: ProductCategory;
  description: string;
  features: string[];
  billingCycle: BillingCycle;
  /** Monthly list price in EUR */
  listPriceMonthly: number;
  /** One-time cost (hardware/installation) in EUR */
  oneTimeCost: number;
  /** Minimum contract months */
  minContractMonths: number;
  /** Compatible add-on SKUs */
  compatibleAddons: string[];
  /** Typical deal segment */
  typicalSegment: ('SMB' | 'Mid-Market' | 'Enterprise')[];
}

// ---------------------------------------------------------------------------
// Hardware Products — Cameras
// ---------------------------------------------------------------------------

export const CAMERA_PRODUCTS: EvercamProduct[] = [
  {
    sku: 'EC-CAM-FIXED-4K',
    name: 'Fixed Indoor Camera (4K)',
    category: 'hardware',
    description: '180° fixed-position 4K camera for interior site monitoring, productivity tracking, and process improvement.',
    features: [
      '4K+ resolution',
      '180° wide-angle lens',
      'Indoor mounting kit',
      'PoE (Power over Ethernet)',
      'Cloud recording included',
      'Tamper detection alerts',
    ],
    billingCycle: 'monthly',
    listPriceMonthly: 350,
    oneTimeCost: 800,
    minContractMonths: 6,
    compatibleAddons: ['EC-SW-TIMELAPSE-PRO', 'EC-SW-AI-ANALYTICS', 'EC-SW-BIM'],
    typicalSegment: ['SMB', 'Mid-Market'],
  },
  {
    sku: 'EC-CAM-PTZ-360',
    name: 'PTZ Camera (360° Pan-Tilt-Zoom)',
    category: 'hardware',
    description: 'Full 360° pan-tilt-zoom with optical zoom for detailed remote inspections. Pre-scheduled capture tours and live manual control.',
    features: [
      '360° pan-tilt-zoom',
      '30x optical zoom',
      'Pre-scheduled capture tours',
      'Live manual control',
      'No visual distortion',
      '4K recording',
      'Weather-sealed housing',
    ],
    billingCycle: 'monthly',
    listPriceMonthly: 550,
    oneTimeCost: 1500,
    minContractMonths: 6,
    compatibleAddons: ['EC-SW-TIMELAPSE-PRO', 'EC-SW-AI-ANALYTICS', 'EC-SW-BIM', 'EC-SW-GATE-REPORT'],
    typicalSegment: ['Mid-Market', 'Enterprise'],
  },
  {
    sku: 'EC-CAM-SOLAR',
    name: 'Solar-Powered Camera Unit',
    category: 'hardware',
    description: 'Self-contained solar-powered unit with 4G connectivity. No mains power or wired network required. Ideal for remote or early-stage sites.',
    features: [
      'Solar-powered (no mains required)',
      '4G LTE connectivity',
      'Self-contained mounting',
      'Battery backup (72hr)',
      'Remote deployment ready',
      'HD recording',
      'Weather-resistant IP67',
    ],
    billingCycle: 'monthly',
    listPriceMonthly: 650,
    oneTimeCost: 2200,
    minContractMonths: 6,
    compatibleAddons: ['EC-SW-TIMELAPSE-PRO', 'EC-SW-AI-ANALYTICS'],
    typicalSegment: ['Mid-Market', 'Enterprise'],
  },
  {
    sku: 'EC-HW-WEATHER',
    name: 'Weather Station',
    category: 'hardware',
    description: 'On-site weather station delivering real-time conditions data — temperature, wind, humidity, precipitation — for operational decision-making.',
    features: [
      'Real-time temperature',
      'Wind speed & direction',
      'Humidity sensor',
      'Precipitation gauge',
      'API integration',
      'Dashboard widget',
    ],
    billingCycle: 'monthly',
    listPriceMonthly: 150,
    oneTimeCost: 600,
    minContractMonths: 12,
    compatibleAddons: [],
    typicalSegment: ['Mid-Market', 'Enterprise'],
  },
];

// ---------------------------------------------------------------------------
// Software Products
// ---------------------------------------------------------------------------

export const SOFTWARE_PRODUCTS: EvercamProduct[] = [
  {
    sku: 'EC-SW-PLATFORM',
    name: 'Evercam Platform (Core)',
    category: 'software',
    description: 'Core cloud platform — live view, recordings, project dashboard, mobile app, unlimited users, uptime monitoring.',
    features: [
      'Live camera view (private/shared)',
      '4K cloud recording',
      'Mobile app (iOS/Android)',
      'Unlimited user accounts',
      'Uptime monitoring & tamper alerts',
      'Scheduled email snapshots',
      'Project dashboard',
      'Role-based access control',
    ],
    billingCycle: 'monthly',
    listPriceMonthly: 500,
    oneTimeCost: 0,
    minContractMonths: 6,
    compatibleAddons: ['EC-SW-TIMELAPSE-PRO', 'EC-SW-AI-ANALYTICS', 'EC-SW-BIM', 'EC-SW-360', 'EC-SW-DRONE', 'EC-SW-GATE-REPORT', 'EC-SW-ARCHIVE'],
    typicalSegment: ['SMB', 'Mid-Market', 'Enterprise'],
  },
  {
    sku: 'EC-SW-TIMELAPSE-PRO',
    name: 'Time-Lapse Pro',
    category: 'addon',
    description: 'Professional time-lapse creation with branded intro/outro, music, narration-ready exports, and automated monthly progress videos.',
    features: [
      'Unlimited custom time-lapses',
      'Branded intro/outro',
      'Music library',
      'Monthly auto-generated progress video',
      'GIF export',
      'Social media optimized formats',
      'End-of-project professional edit',
    ],
    billingCycle: 'monthly',
    listPriceMonthly: 200,
    oneTimeCost: 0,
    minContractMonths: 6,
    compatibleAddons: [],
    typicalSegment: ['SMB', 'Mid-Market', 'Enterprise'],
  },
  {
    sku: 'EC-SW-AI-ANALYTICS',
    name: 'AI Analytics Suite',
    category: 'addon',
    description: 'ML-powered video analytics: PPE detection, people/vehicle counting, smart search, activity heatmaps, and automated safety compliance reports.',
    features: [
      'PPE detection (hard hat, hi-vis)',
      'People counting',
      'Vehicle counting & classification',
      'Smart search (find events by criteria)',
      'Activity heatmaps',
      'Automated safety reports',
      'ANPR (number plate recognition)',
    ],
    billingCycle: 'monthly',
    listPriceMonthly: 350,
    oneTimeCost: 0,
    minContractMonths: 12,
    compatibleAddons: [],
    typicalSegment: ['Mid-Market', 'Enterprise'],
  },
  {
    sku: 'EC-SW-BIM',
    name: 'BIM Integration (4D)',
    category: 'addon',
    description: 'Overlay 3D/4D BIM models on live camera feeds. Powered by Bentley iTwin. Detect deviations between design and as-built conditions.',
    features: [
      '3D/4D model overlay',
      'Bentley iTwin integration',
      'Design vs as-built comparison',
      'Progress tracking against schedule',
      'Model navigation in dashboard',
      'Deviation alerts',
    ],
    billingCycle: 'monthly',
    listPriceMonthly: 400,
    oneTimeCost: 2500,
    minContractMonths: 12,
    compatibleAddons: [],
    typicalSegment: ['Enterprise'],
  },
  {
    sku: 'EC-SW-360',
    name: '360° Virtual Tours',
    category: 'addon',
    description: 'HD 360° site scans with interactive virtual tours, real-time measurements, and team collaboration annotations.',
    features: [
      'HD 360° capture',
      'Interactive virtual tours',
      'In-viewer measurements',
      'Team annotations & comments',
      'Progress comparison (overlay dates)',
      'Shareable tour links',
    ],
    billingCycle: 'monthly',
    listPriceMonthly: 300,
    oneTimeCost: 0,
    minContractMonths: 6,
    compatibleAddons: [],
    typicalSegment: ['Mid-Market', 'Enterprise'],
  },
  {
    sku: 'EC-SW-DRONE',
    name: 'Drone View Integration',
    category: 'addon',
    description: 'Unified drone flight data with fixed cameras. 3D site reconstruction, orthomosaic maps, volumetric analysis.',
    features: [
      '3D site reconstruction',
      'Orthomosaic maps',
      'Volumetric analysis',
      'Flight log integration',
      'Unified timeline (drone + fixed)',
      'Exportable point clouds',
    ],
    billingCycle: 'per-project',
    listPriceMonthly: 0,
    oneTimeCost: 3500,
    minContractMonths: 0,
    compatibleAddons: [],
    typicalSegment: ['Enterprise'],
  },
  {
    sku: 'EC-SW-GATE-REPORT',
    name: 'Gate Reporting & ANPR',
    category: 'addon',
    description: 'Automated gate reports: vehicle entry/exit tracking via ANPR, delivery logging, contractor attendance, and site traffic analytics.',
    features: [
      'Automatic number plate recognition',
      'Vehicle entry/exit logs',
      'Delivery tracking',
      'Contractor attendance',
      'Site traffic reports',
      'CSV/PDF export',
    ],
    billingCycle: 'monthly',
    listPriceMonthly: 250,
    oneTimeCost: 0,
    minContractMonths: 6,
    compatibleAddons: [],
    typicalSegment: ['Mid-Market', 'Enterprise'],
  },
  {
    sku: 'EC-SW-ARCHIVE',
    name: 'Project Archiving',
    category: 'addon',
    description: 'Post-handover secure storage of all images, videos, and documentation. Supports legal claims, maintenance reference, and marketing.',
    features: [
      '10-year secure retention',
      'Legal-grade timestamping',
      'Full media export',
      'Searchable archive',
      'Access control per project',
      'Compliance documentation',
    ],
    billingCycle: 'one-time',
    listPriceMonthly: 0,
    oneTimeCost: 1500,
    minContractMonths: 0,
    compatibleAddons: [],
    typicalSegment: ['Mid-Market', 'Enterprise'],
  },
];

// ---------------------------------------------------------------------------
// Professional Services
// ---------------------------------------------------------------------------

export const SERVICE_PRODUCTS: EvercamProduct[] = [
  {
    sku: 'EC-SVC-INSTALL',
    name: 'Professional Installation',
    category: 'service',
    description: 'On-site camera installation, mounting, network configuration, and platform onboarding by Evercam engineers.',
    features: [
      'Site survey',
      'Camera mounting',
      'Network/4G configuration',
      'Platform onboarding',
      'User training session',
    ],
    billingCycle: 'one-time',
    listPriceMonthly: 0,
    oneTimeCost: 750,
    minContractMonths: 0,
    compatibleAddons: [],
    typicalSegment: ['SMB', 'Mid-Market', 'Enterprise'],
  },
  {
    sku: 'EC-SVC-MANAGED',
    name: 'Managed Service (White Glove)',
    category: 'service',
    description: 'Fully managed camera service — Evercam handles installation, monitoring, maintenance, relocations, and end-of-project decommission.',
    features: [
      'Full lifecycle management',
      'Proactive monitoring',
      'Hardware replacement SLA',
      'Relocations included',
      'Dedicated account manager',
      'Quarterly business review',
    ],
    billingCycle: 'monthly',
    listPriceMonthly: 200,
    oneTimeCost: 0,
    minContractMonths: 12,
    compatibleAddons: [],
    typicalSegment: ['Enterprise'],
  },
];

// ---------------------------------------------------------------------------
// All Products
// ---------------------------------------------------------------------------

export const ALL_PRODUCTS: EvercamProduct[] = [
  ...CAMERA_PRODUCTS,
  ...SOFTWARE_PRODUCTS,
  ...SERVICE_PRODUCTS,
];

// ---------------------------------------------------------------------------
// Bundles (pre-configured packages)
// ---------------------------------------------------------------------------

export interface ProductBundle {
  id: string;
  name: string;
  description: string;
  includedSkus: string[];
  /** Discount off combined list price */
  bundleDiscount: number;
  typicalSegment: ('SMB' | 'Mid-Market' | 'Enterprise')[];
  typicalACV: { min: number; max: number };
}

export const BUNDLES: ProductBundle[] = [
  {
    id: 'BUNDLE-STARTER',
    name: 'Site Starter',
    description: '1 fixed camera + core platform + time-lapse. Perfect for single-site SMB projects.',
    includedSkus: ['EC-CAM-FIXED-4K', 'EC-SW-PLATFORM', 'EC-SW-TIMELAPSE-PRO', 'EC-SVC-INSTALL'],
    bundleDiscount: 0.10,
    typicalSegment: ['SMB'],
    typicalACV: { min: 8000, max: 18000 },
  },
  {
    id: 'BUNDLE-PRO',
    name: 'Project Pro',
    description: '2 PTZ cameras + platform + time-lapse + AI analytics + gate reporting. For mid-size commercial builds.',
    includedSkus: ['EC-CAM-PTZ-360', 'EC-CAM-PTZ-360', 'EC-SW-PLATFORM', 'EC-SW-TIMELAPSE-PRO', 'EC-SW-AI-ANALYTICS', 'EC-SW-GATE-REPORT', 'EC-SVC-INSTALL'],
    bundleDiscount: 0.15,
    typicalSegment: ['Mid-Market'],
    typicalACV: { min: 35000, max: 85000 },
  },
  {
    id: 'BUNDLE-ENTERPRISE',
    name: 'Enterprise Visibility',
    description: 'Multi-site deployment: 5+ cameras (mix), full platform, all add-ons, BIM integration, managed service. For large-scale infrastructure and property developers.',
    includedSkus: ['EC-CAM-PTZ-360', 'EC-CAM-SOLAR', 'EC-CAM-FIXED-4K', 'EC-HW-WEATHER', 'EC-SW-PLATFORM', 'EC-SW-TIMELAPSE-PRO', 'EC-SW-AI-ANALYTICS', 'EC-SW-BIM', 'EC-SW-360', 'EC-SW-GATE-REPORT', 'EC-SW-ARCHIVE', 'EC-SVC-MANAGED'],
    bundleDiscount: 0.20,
    typicalSegment: ['Enterprise'],
    typicalACV: { min: 120000, max: 500000 },
  },
  {
    id: 'BUNDLE-SAFETY',
    name: 'Safety & Compliance',
    description: 'AI analytics + gate reporting + weather station. Add-on bundle for safety-focused sites.',
    includedSkus: ['EC-SW-AI-ANALYTICS', 'EC-SW-GATE-REPORT', 'EC-HW-WEATHER'],
    bundleDiscount: 0.10,
    typicalSegment: ['Mid-Market', 'Enterprise'],
    typicalACV: { min: 15000, max: 40000 },
  },
];
