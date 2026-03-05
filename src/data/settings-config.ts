/**
 * Settings & Scoring Configuration — Maintainable Config Layer
 *
 * Replaces flat constants with typed, versioned, auditable configuration objects.
 * All settings have audit trails, versioning, and proper enum types.
 */

import type { Role } from '@/contexts/RoleContext';

// ---------------------------------------------------------------------------
// Scoring Configuration
// ---------------------------------------------------------------------------

export interface ScoringWeights {
  personaCoverage: number; // 0-1
  processCompleteness: number; // 0-1
  engagementRecency: number; // 0-1
  competitivePosition: number; // 0-1
  dealVelocity: number; // 0-1
}

export interface ScoringThresholds {
  atRiskBelow: number;
  gradeA: number;
  gradeB: number;
  gradeC: number;
  gradeD: number;
}

export interface ScoringConfig {
  id: string;
  name: string;
  version: string;
  isActive: boolean;
  weights: ScoringWeights;
  thresholds: ScoringThresholds;
  stageWeights: Record<string, number>;
  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  // History
  previousVersionId: string | null;
  changelog: string;
}

// ---------------------------------------------------------------------------
// App Settings
// ---------------------------------------------------------------------------

export type ForecastCategoryType = 'Commit' | 'Best Case' | 'Pipeline' | 'Omit';
export type CRMProvider = 'zoho' | 'salesforce' | 'hubspot' | 'demo';
export type AIProvider = 'claude' | 'openai' | 'demo';
export type CoachingModeType = 'hitl' | 'agentic';

export interface AppSettings {
  id: string;
  // Display
  defaultRole: Role;
  defaultExplainMode: boolean;
  defaultCoachingMode: CoachingModeType;
  currency: string;
  dateFormat: string;
  timezone: string;
  locale: string;
  // Fiscal Calendar
  fiscalYearStartMonth: number; // 1-12 (1=January)
  fiscalYearStartDay: number; // 1-28
  // Pipeline
  forecastCategories: ForecastCategoryType[];
  stages: string[];
  segments: string[];
  // Pilot / Onboarding
  pilotStartDate: string | null;
  pilotEndDate: string | null;
  pilotStatus: 'not-started' | 'active' | 'completed' | 'extended';
  dataRetentionDays: number;
  requireApprovalForPush: boolean;
  // Integrations
  crmProvider: CRMProvider;
  aiProvider: AIProvider;
  // Notifications
  alertOnStall: boolean;
  stallThresholdDays: number;
  alertOnPQSdrop: boolean;
  pqsDropThreshold: number;
  // Feature Flags
  enableAICopilot: boolean;
  enablePlayLibrary: boolean;
  enableAgenticMode: boolean;
  enableCompetitiveIntel: boolean;
  enableMEDDIC: boolean;
  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

// ---------------------------------------------------------------------------
// Default Configuration Instances
// ---------------------------------------------------------------------------

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  id: 'sc-001',
  name: 'Evercam PQS v2.4',
  version: '2.4.1',
  isActive: true,
  weights: {
    personaCoverage: 0.3,
    processCompleteness: 0.25,
    engagementRecency: 0.2,
    competitivePosition: 0.15,
    dealVelocity: 0.1,
  },
  thresholds: {
    atRiskBelow: 40,
    gradeA: 80,
    gradeB: 65,
    gradeC: 50,
    gradeD: 35,
  },
  stageWeights: {
    Discovery: 0.15,
    Qualification: 0.25,
    Proposal: 0.4,
    Negotiation: 0.65,
  },
  createdAt: '2025-09-15',
  updatedAt: '2026-02-20',
  createdBy: 'sarah.kavanagh@evercam.com',
  updatedBy: 'sarah.kavanagh@evercam.com',
  previousVersionId: 'sc-000',
  changelog:
    'Increased persona coverage weight from 0.25 to 0.30, reduced deal velocity from 0.15 to 0.10 based on Q4 FY25 win/loss analysis.',
};

export const SCORING_CONFIG_HISTORY: ScoringConfig[] = [
  {
    id: 'sc-000',
    name: 'Evercam PQS v2.3',
    version: '2.3.0',
    isActive: false,
    weights: {
      personaCoverage: 0.25,
      processCompleteness: 0.25,
      engagementRecency: 0.2,
      competitivePosition: 0.15,
      dealVelocity: 0.15,
    },
    thresholds: {
      atRiskBelow: 35,
      gradeA: 80,
      gradeB: 65,
      gradeC: 50,
      gradeD: 35,
    },
    stageWeights: {
      Discovery: 0.15,
      Qualification: 0.25,
      Proposal: 0.4,
      Negotiation: 0.6,
    },
    createdAt: '2025-06-01',
    updatedAt: '2025-09-14',
    createdBy: 'sarah.kavanagh@evercam.com',
    updatedBy: 'sarah.kavanagh@evercam.com',
    previousVersionId: null,
    changelog: 'Initial PQS model based on 6 months of deal outcome data.',
  },
  DEFAULT_SCORING_CONFIG,
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  id: 'settings-001',
  // Display
  defaultRole: 'exec',
  defaultExplainMode: true, // Explain scoring mode ON by default
  defaultCoachingMode: 'hitl',
  currency: 'EUR',
  dateFormat: 'dd/MM/yyyy',
  timezone: 'Europe/Dublin',
  locale: 'en-IE',
  // Fiscal Calendar
  fiscalYearStartMonth: 1, // January (Evercam fiscal year = calendar year)
  fiscalYearStartDay: 1,
  // Pipeline
  forecastCategories: ['Commit', 'Best Case', 'Pipeline', 'Omit'],
  stages: ['Discovery', 'Qualification', 'Proposal', 'Negotiation'],
  segments: ['SMB', 'Mid-Market', 'Enterprise'],
  // Pilot / Onboarding
  pilotStartDate: '2026-03-01',
  pilotEndDate: '2026-05-31',
  pilotStatus: 'active',
  dataRetentionDays: 365,
  requireApprovalForPush: false,
  // Integrations
  crmProvider: 'demo',
  aiProvider: 'claude',
  // Notifications
  alertOnStall: true,
  stallThresholdDays: 14,
  alertOnPQSdrop: true,
  pqsDropThreshold: 10,
  // Feature Flags
  enableAICopilot: true,
  enablePlayLibrary: true,
  enableAgenticMode: true,
  enableCompetitiveIntel: true,
  enableMEDDIC: true,
  // Audit
  createdAt: '2025-09-01',
  updatedAt: '2026-02-25',
  createdBy: 'admin@evercam.com',
  updatedBy: 'sarah.kavanagh@evercam.com',
};

// ---------------------------------------------------------------------------
// Config Access Functions (CRUD-ready for future persistence)
// ---------------------------------------------------------------------------

let _currentSettings = { ...DEFAULT_APP_SETTINGS };
let _currentScoringConfig = { ...DEFAULT_SCORING_CONFIG };

export function getAppSettings(): AppSettings {
  return { ..._currentSettings };
}

export function updateAppSettings(updates: Partial<AppSettings>): AppSettings {
  _currentSettings = {
    ..._currentSettings,
    ...updates,
    updatedAt: new Date().toISOString().slice(0, 10),
  };
  return { ..._currentSettings };
}

export function getScoringConfig(): ScoringConfig {
  return { ..._currentScoringConfig };
}

export function updateScoringConfig(updates: Partial<ScoringConfig>): ScoringConfig {
  const previousId = _currentScoringConfig.id;
  const newVersion = _currentScoringConfig.version.replace(/\d+$/, (n) => String(Number(n) + 1));
  _currentScoringConfig = {
    ..._currentScoringConfig,
    ...updates,
    version: newVersion,
    updatedAt: new Date().toISOString().slice(0, 10),
    previousVersionId: previousId,
  };
  return { ..._currentScoringConfig };
}

export function getScoringConfigHistory(): ScoringConfig[] {
  return [...SCORING_CONFIG_HISTORY];
}

/** Reset to defaults (useful for testing) */
export function resetSettings(): void {
  _currentSettings = { ...DEFAULT_APP_SETTINGS };
  _currentScoringConfig = { ...DEFAULT_SCORING_CONFIG };
}
