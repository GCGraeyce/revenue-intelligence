import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RoleProvider } from '@/contexts/RoleContext';
import { ProductFilterProvider } from '@/contexts/ProductFilterContext';
import { SalesTargetProvider } from '@/contexts/SalesTargetContext';
import { ScoringConfigProvider } from '@/contexts/ScoringConfigContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { Deal, Grade } from '@/data/demo-data';

/**
 * Custom render that wraps components in all required providers.
 * Mirrors the app's provider tree for realistic testing.
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <RoleProvider>
        <ProductFilterProvider>
          <SalesTargetProvider>
            <ScoringConfigProvider>
              <SidebarProvider>
                {children}
              </SidebarProvider>
            </ScoringConfigProvider>
          </SalesTargetProvider>
        </ProductFilterProvider>
      </RoleProvider>
    </BrowserRouter>
  );
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from RTL
export * from '@testing-library/react';
export { customRender as render };

/**
 * Factory function for creating mock Deal objects with sensible defaults.
 * Override any field by passing partial data.
 */
export function createMockDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'EC-TEST-001',
    company: 'Test Corp',
    rep: 'Sophie Chen',
    acv: 120000,
    stage: 'Proposal',
    segment: 'Mid-Market',
    source: 'Inbound',
    pqScore: 62,
    grade: 'B' as Grade,
    probabilities: {
      win: 0.45,
      loss: 0.20,
      noDecision: 0.20,
      slip: 0.15,
    },
    confidence: {
      band: 'Medium' as const,
      volatility: 0.12,
      completeness: 0.78,
    },
    icpScore: 72,
    personaGaps: ['Economic Buyer (CFO/Finance Director)'],
    missingSteps: ['ROI Business Case', 'Executive Sponsor Meeting'],
    priceRisk: 0.3,
    daysInStage: 14,
    closeDate: '2026-04-15',
    createdDate: '2026-01-10',
    nextActions: ['Schedule CFO meeting', 'Send ROI deck'],
    productBundle: 'Project Pro',
    cameraCount: 8,
    projectType: 'Commercial Office',
    competitor: 'OxBlue',
    forecastCategory: 'Best Case' as const,
    activities: {
      calls: 5,
      emails: 12,
      meetings: 3,
      lastActivityDate: '2026-02-24',
      lastActivityType: 'Meeting',
    },
    timeline: [
      { date: '2026-01-10', type: 'stage-change', description: 'Moved to Discovery' },
      { date: '2026-01-25', type: 'stage-change', description: 'Moved to Qualification' },
      { date: '2026-02-10', type: 'stage-change', description: 'Moved to Proposal' },
      { date: '2026-02-20', type: 'activity', description: 'Demo completed with Project Manager' },
    ],
    country: 'IE',
    dealType: 'new-business',
    channelPartner: null,
    // Production-grade fields
    status: 'active',
    lossReason: null,
    currencyCode: 'EUR',
    discountPct: 0,
    discountApprover: null,
    discountApprovalDate: null,
    contractType: 'annual',
    contractLength: 12,
    renewalProbability: 0.8,
    implementationStatus: 'not-started',
    meddic: { metrics: 60, economicBuyer: 45, decisionCriteria: 55, decisionProcess: 50, identifyPain: 70, champion: 65, overall: 57 },
    accountId: null,
    primaryContactId: null,
    createdBy: 'system@evercam.com',
    lastModifiedBy: 'system@evercam.com',
    updatedAt: '2026-02-25',
    isDeleted: false,
    deletedAt: null,
    stageHistory: [
      { stage: 'Discovery', enteredAt: '2026-01-10', exitedAt: '2026-01-25', daysInStage: 15, movedBy: 'Sophie Chen' },
      { stage: 'Qualification', enteredAt: '2026-01-25', exitedAt: '2026-02-10', daysInStage: 16, movedBy: 'Sophie Chen' },
      { stage: 'Proposal', enteredAt: '2026-02-10', exitedAt: null, daysInStage: 14, movedBy: 'Sophie Chen' },
    ],
    competitiveIntel: { competitor: 'OxBlue', theirPrice: 95000, ourAdvantage: 'AI-powered analytics, BIM integration', theirAdvantage: 'Established brand' },
    ...overrides,
  };
}

/**
 * Create an array of mock deals for testing list-based components.
 */
export function createMockDealList(count: number = 5): Deal[] {
  const stages = ['Discovery', 'Qualification', 'Proposal', 'Negotiation'];
  const grades: Grade[] = ['A', 'B', 'C', 'D', 'F'];
  const reps = ['Sophie Chen', 'James Murphy', 'Elena Rodriguez', 'Arun Kapoor', 'Liam O\'Brien'];
  const companies = ['Titan Construction', 'Meridian Group', 'Horizon Properties', 'Atlas Engineering', 'Pinnacle Builders'];

  return Array.from({ length: count }, (_, i) => createMockDeal({
    id: `EC-TEST-${String(i + 1).padStart(3, '0')}`,
    company: companies[i % companies.length],
    rep: reps[i % reps.length],
    stage: stages[i % stages.length],
    grade: grades[i % grades.length],
    pqScore: 85 - (i * 12),
    acv: 200000 - (i * 30000),
    daysInStage: 5 + (i * 7),
    forecastCategory: i < 2 ? 'Commit' : i < 4 ? 'Best Case' : 'Pipeline',
  }));
}
