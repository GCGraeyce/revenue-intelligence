# Revenue Intelligence & Coaching OS — Production Design Spec

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/Vite)                     │
│  Lovable-generated UI → shadcn/ui + Tailwind + TanStack     │
├─────────────────────────────────────────────────────────────┤
│                     Edge Functions (Backend)                  │
│  score-deal │ generate-forecast │ evaluate-plays │ sync-crm  │
│  ingest-signals │ coaching-action                            │
├─────────────────────────────────────────────────────────────┤
│                     Zoho Integration Layer                    │
│  Zoho CRM │ Zoho Mail │ Zoho Meeting │ Zoho Zia             │
├─────────────────────────────────────────────────────────────┤
│                     AI/ML Layer                              │
│  PQS Engine │ Forecast Confidence │ Coaching Engine          │
│  Self-Learning Pipeline (by ICP, product, salesperson)       │
├─────────────────────────────────────────────────────────────┤
│                     Data Layer (Supabase)                     │
│  Deals │ Contacts │ Signals │ Scores │ History │ Actions    │
│  RLS per user/team │ Audit log │ Versioned scores           │
└─────────────────────────────────────────────────────────────┘
```

## 2. Data Model

### Core Tables
- `deals` — Synced from Zoho CRM, enriched with PQS scores
- `contacts` — Synced from Zoho CRM, role-tagged (Champion, EB, etc.)
- `accounts` — Customer accounts with segment/ICP classification
- `engagement_signals` — Unified signals from CRM, Mail, Meeting, Zia
- `pqs_scores` — Versioned Pipeline Quality Scores (trend analysis)
- `coaching_actions` — Tier 1/2/3 actions with approval workflow
- `pipeline_history` — Nightly snapshots for self-learning model training
- `forecast_snapshots` — Daily org/team/rep forecast captures
- `audit_log` — All score overrides, config changes, action approvals

## 3. Role-Based Access Control

| Role | Sees | Can Do |
|------|------|--------|
| **Rep** | Own deals, own PQS, coaching actions assigned to them | Approve Tier 1 actions, update deal notes |
| **Manager** | Team deals, team rollup, intervention queue | Approve Tier 2 actions, override scores, reassign deals |
| **Exec** | Org-wide pipeline, forecast bands, segment breakdown | Approve Tier 3 actions, set targets |
| **RevOps** | System health, model performance, all data | Configure scoring weights, manage plays, retrain triggers |

**RLS Strategy:** Every table uses `user_id` or `team_id` scoping. Use a `has_role()` security definer function (never store role on users table). Managers see `WHERE team_id = my_team_id`, execs see all.

## 4. Pipeline Quality Score (PQS) Engine

### 5 Dimensions (each 0–20, total 0–100):

| Dimension | Signals | Weight |
|-----------|---------|--------|
| **Engagement** | Email frequency, meeting cadence, response time, recency | 20 |
| **Stakeholder** | # contacts, champion identified, economic buyer mapped, multithreading depth | 20 |
| **Timing** | Days in stage vs. benchmark, close date movement, velocity | 20 |
| **Commercial** | Discount %, pricing discussed, proposal sent, legal engaged | 20 |
| **Execution** | Next steps defined, mutual action plan, competitive intel, MEDDIC completion | 20 |

**Grade Mapping:** A ≥ 80, B ≥ 65, C ≥ 50, D ≥ 35, F < 35

**Scoring runs:** On every signal ingestion (real-time) + nightly batch recalc. Store versioned scores for trend analysis.

## 5. Forecast Confidence Engine

```
Quality-Adjusted Pipeline = Σ (deal.acv × deal.win_probability)

Confidence Band:
  - Low:  Σ (deal.acv × confidence_band.low)
  - Mid:  Σ (deal.acv × confidence_band.mid)
  - High: Σ (deal.acv × confidence_band.high)
```

Win probability derived from: PQS grade, stage, segment, historical conversion rates.
Confidence band width widens for lower-grade deals.

## 6. Coaching Engine — Action Tiers

| Tier | Approval | Example |
|------|----------|---------|
| **Tier 1** | Rep self-serve | Silence Alert, Deal Slip Risk, Multi-thread Gap |
| **Tier 2** | Manager approval | Champion Left, Budget Escalation, Competitive Threat |
| **Tier 3** | Exec approval | Strategic Account Intervention, Pricing Exception |

### Example Plays:
- **Silence Alert (Tier 1):** No email/meeting in 14 days → suggest re-engagement template
- **Champion Left (Tier 2):** Contact role change detected → escalate to manager
- **Deal Slip Risk (Tier 1):** Close date pushed 2x → trigger pipeline review
- **Multi-thread Gap (Tier 1):** Only 1 contact on enterprise deal → suggest stakeholder mapping

## 7. Page Structure & Components

| Route | Page | Key Components |
|-------|------|----------------|
| `/` | Command Center | MetricCards, ForecastBand, GradeDistribution, SegmentBreakdown, RiskClusters, InterventionQueue |
| `/pipeline` | Pipeline View | PipelineFunnel, StageBreakdown, VelocityChart, FilterBar |
| `/deals` | Deal List | DealTable (sortable/filterable), DealDrawer (detail panel with score breakdown) |
| `/deals/:id` | Deal Detail | ScoreRadar, SignalTimeline, ContactMap, CoachingActions, ActivityFeed |
| `/coaching` | Coaching Hub | ActionQueue (by tier), PlayLibrary, EffectivenessMetrics |
| `/team` | Team View | RepLeaderboard, TeamHeatmap, 1on1Prep |
| `/risk` | Risk Monitor | RiskClusters, SlipForecast, AtRiskDeals |
| `/model` | Model Health | AccuracyCharts, FeatureImportance, DriftMonitor, ScoringLogs |
| `/settings` | Settings | ScoringWeights, PlayConfig, IntegrationStatus, UserManagement |

## 8. Edge Functions (Backend Logic)

| Function | Trigger | Purpose |
|----------|---------|---------|
| `score-deal` | On signal insert / cron nightly | Recalculate PQS + win probability |
| `generate-forecast` | Cron daily | Build org/team/rep forecast snapshots |
| `evaluate-plays` | On score change | Match coaching plays to deal state, create actions |
| `sync-crm` | Cron / webhook | Pull deals, contacts, activities from Zoho CRM |
| `ingest-signals` | Webhook from Zoho Mail/Meeting | Parse and store engagement signals |
| `coaching-action` | On action approval | Execute the play (send email, create task, notify) |

## 9. Key UI Patterns

- **Glass cards:** `bg-card border border-border/60 rounded-xl shadow-sm` with hover elevation
- **Metric display:** Mono font (JetBrains Mono), 3xl bold, with sub-labels in 10px uppercase tracking
- **Grade badges:** Color-coded (A=green, B=teal, C=amber, D=orange, F=red) with 12% opacity backgrounds
- **Data tables:** Striped rows, sticky headers, mono tabular-nums, click-to-expand drawer
- **Animations:** `animate-fade-in` on mount, smooth transitions on hover (200ms)
- **Responsive:** 4-col grid → 2-col → 1-col, collapsible sidebar

## 10. Design Tokens (CSS Variables)

```css
--background: 220 20% 97%      /* Light warm gray */
--foreground: 222 47% 11%      /* Near black */
--card: 0 0% 100%              /* White */
--primary: 221 83% 53%         /* Blue */
--grade-a: 152 69% 38%         /* Green */
--grade-b: 173 58% 39%         /* Teal */
--grade-c: 38 92% 50%          /* Amber */
--grade-d: 25 95% 53%          /* Orange */
--grade-f: 0 72% 51%           /* Red */
--font-sans: 'Inter'
--font-mono: 'JetBrains Mono'
--radius: 0.75rem
```

## 11. Demo Data Shape (for prototyping)

Generate 750 deals with realistic distributions:
- 15% Grade A, 25% B, 30% C, 20% D, 10% F
- Segments: 20% Enterprise, 40% Mid-Market, 40% SMB
- ACV ranges: Enterprise $200K–$2M, MM $50K–$200K, SMB $10K–$50K
- 6 stages with realistic conversion falloff
- 8–12 reps across 3 teams

## 12. Self-Learning Pipeline Model

The system learns from historical pipeline outcomes to improve predictions:

### Training Data Sources:
- `pipeline_history` table — nightly snapshots of every deal's state
- Segmented by: **ICP**, **product**, **salesperson**, **team**, **segment**

### Model Features:
- PQS score trajectory (improving vs declining)
- Days in stage vs segment benchmark
- Email/meeting frequency vs won-deal averages
- Stakeholder count vs deal size
- Close date movement patterns
- Salesperson historical conversion by stage

### Retraining Triggers:
- Model drift detected (accuracy drops below threshold)
- Quarterly automatic retrain
- RevOps manual trigger from `/model` page
- Significant data volume milestone (e.g., every 100 closed deals)

### Feedback Loop:
```
Deal Outcome (Won/Lost) → Update Training Set
→ Retrain Win Probability Model
→ Recalibrate PQS Weights (if drift)
→ Update Confidence Bands
→ More Accurate Forecasts
```

## 13. Zoho Integration Points

| Zoho Product | Data | Sync Method |
|-------------|------|-------------|
| **Zoho CRM** | Deals, Contacts, Accounts, Activities, Notes | Webhook + cron |
| **Zoho Mail** | Email threads, response times, engagement | OAuth API polling |
| **Zoho Meeting** | Meeting attendance, duration, frequency | Webhook |
| **Zoho Zia** | Transcriptions, sentiment, key topics, action items | Post-meeting API |

### CRM Prompt Library Integration:
The 55 prompts in `/packages/services/src/claude/prompts/crm/` feed directly into:
- **Coaching Engine** — automated play recommendations use prompt templates
- **1:1 Prep** — manager coaching prompts pre-populated with deal data
- **Forecast Calls** — automated agenda and summary generation
- **QBR Reports** — templated executive summaries and performance analysis

## 14. Production Considerations

- **Auth:** Email + OAuth (Google SSO), MFA for admins
- **RLS:** Every table has row-level security, never bypass on client
- **Caching:** TanStack Query with 30s stale time for dashboards, 5min for settings
- **Error boundaries:** Per-page error boundaries with fallback UI
- **Optimistic updates:** For coaching action approvals/dismissals
- **Audit log:** All coaching actions, score overrides, and config changes logged
- **Rate limiting:** Edge functions capped at 100 req/min per user

## 15. Lovable MVP Files Location

Place Lovable-exported frontend files in:
```
workflow-automation-platform/apps/revenue-intelligence/
├── src/
│   ├── components/     ← Lovable-generated components
│   ├── pages/          ← Route pages
│   ├── hooks/          ← Custom hooks
│   ├── lib/            ← Utilities
│   └── App.tsx         ← Root component
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── DESIGN-SPEC.md      ← This file
```
