/**
 * Frontend-friendly CRM Prompt Library
 *
 * Static metadata extracted from packages/services/src/claude/prompts/crm/
 * for display in the PlayLibrary UI. 59 prompts across 11 funnel stages.
 *
 * Note: buildPrompt() functions are backend-only and not included here.
 */

export type FunnelStage =
  | 'deal-strategy-review'
  | 'forecasting'
  | 'pipeline-management'
  | 'pipeline-review-meeting'
  | 'forecast-meeting'
  | 'quarterly-business-review'
  | 'executive-reporting-monthly'
  | 'one-on-one-coaching'
  | 'onboarding-ramp'
  | 'performance-management'
  | 'churn-expansion-oversight';

export type PromptCategory = 'deep-research' | 'execution';

export interface PromptEntry {
  id: string;
  name: string;
  description: string;
  category: PromptCategory;
  funnelStage: FunnelStage;
  successMetric: string;
  warnings: string;
}

export const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  'deal-strategy-review': 'Deal Strategy & Review',
  forecasting: 'Forecasting',
  'pipeline-management': 'Pipeline Management',
  'pipeline-review-meeting': 'Pipeline Review Meetings',
  'forecast-meeting': 'Forecast Call Prep',
  'quarterly-business-review': 'Quarterly Business Review',
  'executive-reporting-monthly': 'Executive Reporting',
  'one-on-one-coaching': '1:1 Coaching Sessions',
  'onboarding-ramp': 'Onboarding & Ramp',
  'performance-management': 'Performance Management',
  'churn-expansion-oversight': 'Churn & Expansion',
};

export const FUNNEL_STAGE_ORDER: FunnelStage[] = [
  'deal-strategy-review',
  'forecasting',
  'pipeline-management',
  'pipeline-review-meeting',
  'forecast-meeting',
  'quarterly-business-review',
  'executive-reporting-monthly',
  'one-on-one-coaching',
  'onboarding-ramp',
  'performance-management',
  'churn-expansion-oversight',
];

export const PROMPT_LIBRARY: PromptEntry[] = [
  // ── deal-strategy-review (6) ──
  {
    id: 'flag-high-risk-deals',
    name: 'Flag high-risk deals in current pipeline',
    description:
      'Quickly spots shaky commit deals so you can jump in and keep revenue from slipping away.',
    category: 'deep-research',
    funnelStage: 'deal-strategy-review',
    successMetric:
      'Fewer surprise deal slips — 100% of identified risky deals are either closed or reforecasted appropriately',
    warnings:
      "Automated risk flags aren't perfect. Always double-check with the account owner; a deal might look inactive in CRM but still be progressing offline.",
  },
  {
    id: 'extract-win-loss-insights',
    name: 'Extract win/loss insights from recent deals',
    description: 'Turns one win and one loss into bite-sized lessons the whole team can act on.',
    category: 'deep-research',
    funnelStage: 'deal-strategy-review',
    successMetric: 'Win rate improvement (+X% next quarter) by applying identified lessons',
    warnings:
      'Individual win/loss stories can be anecdotal. Validate patterns across multiple deals before overhauling strategy.',
  },
  {
    id: 'assess-meddic-completeness',
    name: 'Assess MEDDIC completeness for a key deal',
    description:
      "Checks whether each MEDDIC box is ticked — and flags what's missing — on a must-win opportunity.",
    category: 'deep-research',
    funnelStage: 'deal-strategy-review',
    successMetric: '100% MEDDIC criteria covered for key deals (no critical gaps before close)',
    warnings:
      "A fully filled MEDDIC checklist doesn't guarantee a win; qualitative factors matter. Use MEDDIC as a guide.",
  },
  {
    id: 'create-win-strategy-plan',
    name: 'Create a win strategy plan for a critical deal',
    description: 'Sketches a step-by-step battle plan to tip a marquee deal in your favor.',
    category: 'execution',
    funnelStage: 'deal-strategy-review',
    successMetric: 'Deal closed (or advanced significantly) after executing plan',
    warnings:
      "Even a perfect strategy can fail if the customer's situation changes. Prepare the rep for plan B.",
  },
  {
    id: 'prepare-executive-summary-deal',
    name: 'Prepare executive summary for a big deal',
    description:
      'Generates a clean one-pager that gets leadership up to speed — and ready to help — within minutes.',
    category: 'execution',
    funnelStage: 'deal-strategy-review',
    successMetric: 'Leadership provides timely support resulting in accelerated deal closure',
    warnings: "Use executive time wisely. Only escalate what's truly needed for key deals.",
  },
  {
    id: 'document-lost-deal-sbi',
    name: 'Document a lost deal for team learning (SBI format)',
    description: 'Captures the what, why, and lesson of a loss without finger-pointing.',
    category: 'execution',
    funnelStage: 'deal-strategy-review',
    successMetric: "Common loss reasons addressed — next quarter's similar deals win rate improves",
    warnings:
      'Maintain a blameless culture. The goal is to fix process or strategy issues, not to publicly shame the rep.',
  },

  // ── forecasting (6) ──
  {
    id: 'quarter-end-closing-strategy',
    name: 'Quarter-end closing strategy for forecast attainment',
    description:
      'Rallies the team with a laser-focused, last-mile playbook to lock in every dollar before the books close.',
    category: 'execution',
    funnelStage: 'forecasting',
    successMetric:
      'All commit deals receive focused attention; ≥95% of commit revenue closes by quarter-end',
    warnings:
      "End-of-quarter pushes can strain customer relationships. Push hard, but don't sacrifice long-term goodwill.",
  },
  {
    id: 'summarize-forecast-for-execs',
    name: 'Summarize forecast status for executives',
    description:
      'Distills the current forecast into a few punchy bullets execs can absorb in 60 seconds.',
    category: 'execution',
    funnelStage: 'forecasting',
    successMetric: 'Leadership alignment on forecast — no surprises at quarter-end',
    warnings:
      'Maintain realism in communication. Overconfidence or excessive caveats can both undermine credibility.',
  },
  {
    id: 'mitigation-plan-forecast-shortfall',
    name: 'Mitigation plan for forecast shortfall risk',
    description:
      'Lays out a practical, multi-pronged plan to close any looming gap before the quarter ends.',
    category: 'execution',
    funnelStage: 'forecasting',
    successMetric: 'Achieve 100% of target despite initial shortfall (gap closed)',
    warnings: 'Avoid last-minute desperation tactics that erode margin or customer trust.',
  },
  {
    id: 'find-largest-forecast-variances',
    name: 'Find which reps/teams have largest forecast variances',
    description:
      'Zeroes in on the individuals or pods whose commits are least reliable, guiding coaching focus.',
    category: 'deep-research',
    funnelStage: 'forecasting',
    successMetric:
      "Improved individual forecast accuracy (each rep's forecast within ±5–10% of actual)",
    warnings:
      'Discuss forecast accuracy privately with reps; publicizing individual errors can hurt trust.',
  },
  {
    id: 'identify-historical-forecast-bias',
    name: 'Identify historical forecast bias (over/under trends)',
    description: 'Spots persistent sandbagging or optimism so you can recalibrate future commits.',
    category: 'deep-research',
    funnelStage: 'forecasting',
    successMetric: 'Quarterly forecast error reduced to <5%',
    warnings: 'If market conditions changed recently, past bias may not hold going forward.',
  },
  {
    id: 'compare-commit-pipeline-ai-forecast',
    name: 'Compare commit vs pipeline vs AI forecast',
    description:
      'Highlights the delta between human commit numbers, stage-weighted projections, and the AI call.',
    category: 'deep-research',
    funnelStage: 'forecasting',
    successMetric: 'Forecast within 5% of actuals (high accuracy)',
    warnings:
      "Numbers alone don't capture everything. Consider qualitative factors the AI might miss.",
  },

  // ── pipeline-management (6) ──
  {
    id: 'request-pipeline-data-update',
    name: 'Request reps to update pipeline data (hygiene)',
    description:
      'Gives you a crisp email template that nudges reps to clean up stale or missing CRM fields.',
    category: 'execution',
    funnelStage: 'pipeline-management',
    successMetric: '100% of deals updated in CRM; forecast accuracy improved due to current data',
    warnings: 'Avoid negative tone; frame as collective improvement effort.',
  },
  {
    id: 'align-marketing-pipeline-gaps',
    name: 'Align with marketing to fill pipeline gaps',
    description:
      'Crafts a joint action plan that gets Marketing pulling in the same direction to back-fill coverage shortfalls.',
    category: 'execution',
    funnelStage: 'pipeline-management',
    successMetric:
      'Marketing-sales initiative launched (X new opportunities generated within a month)',
    warnings: 'Frame it as a partnership, not blame.',
  },
  {
    id: 'plan-pipeline-generation-boost',
    name: 'Plan actions to boost pipeline generation',
    description:
      'Maps out quick-hit initiatives to pump fresh, qualified leads into the funnel fast.',
    category: 'execution',
    funnelStage: 'pipeline-management',
    successMetric: 'Pipeline coverage restored to ≥3x target after initiatives',
    warnings:
      'Ensure Marketing has capacity and agreement. Coordinate closely on feasible targets.',
  },
  {
    id: 'benchmark-team-metrics',
    name: 'Benchmark team metrics vs industry standards',
    description:
      'Shows how your core KPIs stack up against the wider SaaS market and flags any competitive gaps.',
    category: 'deep-research',
    funnelStage: 'pipeline-management',
    successMetric: 'Close gaps to benchmarks (e.g., win rate into 20–30% range)',
    warnings:
      'Benchmarks are general — differences in market or product can skew direct comparisons.',
  },
  {
    id: 'spot-stagnant-deals',
    name: 'Spot stagnant deals in pipeline stages',
    description:
      'Shines a light on opportunities that have been gathering dust so you can kick-start or close them.',
    category: 'deep-research',
    funnelStage: 'pipeline-management',
    successMetric: 'Reduced sales-cycle delays (fewer deals stuck beyond target days)',
    warnings:
      'Not all silent deals are lost — confirm context with reps before dropping opportunities.',
  },
  {
    id: 'identify-pipeline-coverage-gaps',
    name: 'Identify pipeline coverage gaps and risk deals',
    description:
      'Pinpoints where your pipeline is light and which deals could derail target-attainment if they slip.',
    category: 'deep-research',
    funnelStage: 'pipeline-management',
    successMetric: 'Maintain ≥3x pipeline coverage (no pipeline shortfall)',
    warnings:
      'High coverage (4x+) can include stagnant deals. Focus on quality, not just quantity.',
  },

  // ── pipeline-review-meeting (6) ──
  {
    id: 'summarize-weekly-pipeline-changes',
    name: 'Summarize weekly pipeline changes',
    description:
      'Rolls up what moved in or out of the funnel since last week so nothing sneaks past the team.',
    category: 'deep-research',
    funnelStage: 'pipeline-review-meeting',
    successMetric: 'Team awareness of pipeline delta — no significant change goes undiscussed',
    warnings:
      "Highlight quality, not just quantity — a flood of new opps means little if they're unqualified.",
  },
  {
    id: 'find-stalled-deals-pipeline-call',
    name: 'Find stalled deals to discuss in pipeline call',
    description:
      'Flags deals stuck beyond the usual cycle time so they hit the top of the meeting agenda.',
    category: 'deep-research',
    funnelStage: 'pipeline-review-meeting',
    successMetric:
      'Aged deals addressed (either progressed or removed; average pipeline age reduced)',
    warnings:
      'A deal might appear stalled but could have progress not logged in CRM. Ask the rep first.',
  },
  {
    id: 'highlight-top-opportunities',
    name: 'Highlight top opportunities for team focus',
    description:
      'Spotlights the biggest revenue swings in play, ensuring everyone rallies around the right deals.',
    category: 'deep-research',
    funnelStage: 'pipeline-review-meeting',
    successMetric:
      'No major deal is overlooked in meetings (all top 5 deals discussed until resolved)',
    warnings: "Don't focus only on big deals — smaller but numerous deals in aggregate matter too.",
  },
  {
    id: 'set-pipeline-review-agenda',
    name: 'Set agenda for weekly pipeline review call',
    description:
      'Produces a time-boxed agenda that prevents your pipeline call from ballooning off schedule.',
    category: 'execution',
    funnelStage: 'pipeline-review-meeting',
    successMetric:
      'Efficient meeting (~30 min, covers all sections) with all pipeline risks addressed',
    warnings:
      "Allow flexibility if a critical issue emerges. Don't cut off important deal discussions.",
  },
  {
    id: 'send-pipeline-meeting-followup',
    name: 'Send follow-up email after pipeline meeting',
    description:
      'Transforms meeting notes into a crisp action email that keeps owners accountable.',
    category: 'execution',
    funnelStage: 'pipeline-review-meeting',
    successMetric: '100% of action items completed by next meeting',
    warnings: 'Keep the tone positive and factual. Send promptly (same day) for best effect.',
  },
  {
    id: 'provide-rep-pipeline-scorecards',
    name: 'Provide rep-wise pipeline scorecards',
    description:
      "Delivers at-a-glance report cards showing each rep's pipeline health and exposure.",
    category: 'execution',
    funnelStage: 'pipeline-review-meeting',
    successMetric: 'Balanced pipeline hygiene improved (no rep below 2x coverage after assistance)',
    warnings: 'Use visibility to offer help rather than to shame. The aim is to allocate support.',
  },

  // ── forecast-meeting (6) ──
  {
    id: 'consolidate-team-forecast',
    name: 'Consolidate team forecast (commit vs target)',
    description:
      "Rolls up each manager's numbers into a single view that tells leadership where you really stand.",
    category: 'deep-research',
    funnelStage: 'forecast-meeting',
    successMetric: "Accurate forecast roll-up — leadership trusts each team's numbers",
    warnings: 'Different managers have different forecasting styles. Annotate with context.',
  },
  {
    id: 'explain-week-over-week-forecast-changes',
    name: 'Explain week-over-week forecast changes',
    description:
      'Calls out the specific deals that shifted the forecast — up or down — so you can walk execs through the variance.',
    category: 'deep-research',
    funnelStage: 'forecast-meeting',
    successMetric:
      'All material forecast changes accounted for — leadership hears reasons behind any delta',
    warnings: 'Always verify with deal owners before the call that these changes are up-to-date.',
  },
  {
    id: 'review-commit-deals-risk-signals',
    name: 'Review commit deals for risk signals',
    description:
      'Scans the commit list for ghosts: low activity, negative sentiment, or missing decision makers.',
    category: 'deep-research',
    funnelStage: 'forecast-meeting',
    successMetric: 'No unchecked blind spots in commit; high-risk deals get attention',
    warnings: 'Reps might not log every interaction. Cross-check outside CRM data to confirm risk.',
  },
  {
    id: 'organize-forecast-call-agenda',
    name: 'Organize the weekly forecast call agenda',
    description:
      'Supplies a tight agenda that keeps the call on metrics, risks, and next steps — not rabbit holes.',
    category: 'execution',
    funnelStage: 'forecast-meeting',
    successMetric: 'Forecast call stays on track and yields clear decisions',
    warnings: 'Balance efficiency with open communication about concerns.',
  },
  {
    id: 'advise-forecast-adjustments',
    name: 'Advise forecast adjustments to meet target',
    description:
      'Suggests sensible bumps or trims to commit so the roll-up mirrors reality, not wishful thinking.',
    category: 'execution',
    funnelStage: 'forecast-meeting',
    successMetric: 'Refined forecast aligns with reality, reducing variance at quarter-end',
    warnings:
      'Over-adjusting can demoralize or create false pressure. Balance optimism with realism.',
  },
  {
    id: 'share-post-forecast-call-update',
    name: 'Share post-forecast call update and next steps',
    description:
      'Sends a concise recap of forecast decisions, changes, and action items to leadership and team.',
    category: 'execution',
    funnelStage: 'forecast-meeting',
    successMetric:
      'Alignment with leadership on new commit; no confusion among team on forecast status',
    warnings: 'Ensure the numbers match what was said. Any inconsistency can erode trust.',
  },

  // ── quarterly-business-review (6) ──
  {
    id: 'recap-quarterly-performance',
    name: 'Recap quarterly sales performance vs target',
    description: 'Summarizes how the quarter shook out — good, bad, and why — in one quick glance.',
    category: 'deep-research',
    funnelStage: 'quarterly-business-review',
    successMetric: 'Executives grasp quarterly results at a glance with context',
    warnings:
      'If one-off events skewed results, mention it. Pure numbers can mislead without context.',
  },
  {
    id: 'analyze-quarterly-performance-drivers',
    name: 'Analyze quarterly performance drivers',
    description:
      'Tells the story behind the numbers by tying funnel shifts to wins, losses, and cycle changes.',
    category: 'deep-research',
    funnelStage: 'quarterly-business-review',
    successMetric: 'Leadership understands key performance drivers and makes decisions accordingly',
    warnings: 'Some trends might be due to external factors rather than team execution.',
  },
  {
    id: 'compare-team-rep-performance',
    name: 'Compare team and rep performance (rankings)',
    description:
      'Ranks top performers and laggards, complete with context, to guide recognition and support.',
    category: 'deep-research',
    funnelStage: 'quarterly-business-review',
    successMetric:
      'Key talent insights shared — top performers recognized, underperformers identified for support',
    warnings: 'Be sensitive in broad forums. Frame underperformance as coaching needs, not blame.',
  },
  {
    id: 'outline-qbr-presentation',
    name: 'Outline the QBR presentation structure',
    description:
      'Gives you a slide outline so your QBR flows logically from results to lessons to next-quarter plan.',
    category: 'execution',
    funnelStage: 'quarterly-business-review',
    successMetric: 'Comprehensive QBR delivered within allotted time with clear visibility',
    warnings: "Ensure enough time on forward plan — execs care about how you'll fix issues.",
  },
  {
    id: 'propose-next-quarter-initiatives',
    name: 'Propose top initiatives for next quarter',
    description:
      "Suggests three high-impact plays that directly tackle this quarter's biggest gaps.",
    category: 'execution',
    funnelStage: 'quarterly-business-review',
    successMetric: 'Initiatives approved and resourced by leadership',
    warnings: 'Limit to a critical few — too many initiatives dilute focus.',
  },
  {
    id: 'draft-qbr-executive-summary',
    name: 'Draft executive summary for QBR report',
    description:
      'Crafts an opening narrative that balances candor and confidence for the exec deck.',
    category: 'execution',
    funnelStage: 'quarterly-business-review',
    successMetric: 'Execs have a clear, concise narrative — informed and focused QBR discussion',
    warnings: "Don't sugarcoat issues. Show you understand and have a plan.",
  },

  // ── executive-reporting-monthly (6) ──
  {
    id: 'compile-monthly-sales-snapshot',
    name: 'Compile monthly sales results snapshot',
    description:
      "Packs the month's key wins, misses, and pipeline picture into a bite-sized report.",
    category: 'deep-research',
    funnelStage: 'executive-reporting-monthly',
    successMetric:
      'Monthly summary delivered with 100% accuracy — execs get a quick performance read',
    warnings: 'One month is a small sample. Mention if an anomaly is expected to normalize.',
  },
  {
    id: 'detect-early-warning-signals',
    name: 'Detect early warning signals from monthly data',
    description:
      'Surfaces subtle red (or green) flags before they snowball into end-of-quarter surprises.',
    category: 'deep-research',
    funnelStage: 'executive-reporting-monthly',
    successMetric: 'No surprises at quarter-end — issues identified early and mitigated',
    warnings:
      'Flag only truly significant deviations. Too many minor warnings cause alert fatigue.',
  },
  {
    id: 'highlight-monthly-wins-challenges',
    name: 'Highlight monthly wins and challenges',
    description:
      'Pairs one headline victory with one honest headache to keep leadership informed and engaged.',
    category: 'deep-research',
    funnelStage: 'executive-reporting-monthly',
    successMetric: 'Executives have a balanced view — informed questions and focus',
    warnings:
      "For challenges, note what's being done about it. Execs want to know you're on top of it.",
  },
  {
    id: 'draft-monthly-performance-email',
    name: 'Draft monthly sales performance email to execs',
    description:
      'Writes a two-paragraph update that execs can digest on their phones between meetings.',
    category: 'execution',
    funnelStage: 'executive-reporting-monthly',
    successMetric:
      'Executives are well-informed from the email alone (few follow-up questions needed)',
    warnings: 'Keep it concise. Ensure alignment with the formal report/dashboard.',
  },
  {
    id: 'provide-bi-dashboard-commentary',
    name: 'Provide commentary for BI dashboard metrics',
    description:
      'Adds punchy "so-what" notes beneath each chart so numbers translate into meaning.',
    category: 'execution',
    funnelStage: 'executive-reporting-monthly',
    successMetric: 'Executives correctly interpret dashboard data — fewer clarification questions',
    warnings: "Update comments with latest data. Don't state the obvious; add value.",
  },
  {
    id: 'update-rolling-forecast-request-support',
    name: 'Update rolling forecast & request support',
    description: 'Revises the quarter outlook after month-end and flags any executive help needed.',
    category: 'execution',
    funnelStage: 'executive-reporting-monthly',
    successMetric: 'Leadership alignment on quarter outlook and resource needs',
    warnings: 'If asking for help, be specific and justified.',
  },

  // ── one-on-one-coaching (6) ──
  {
    id: 'summarize-rep-performance',
    name: "Summarize individual rep's performance vs targets",
    description: "Pulls a rep's key numbers into a snapshot that makes 1-on-1 prep effortless.",
    category: 'deep-research',
    funnelStage: 'one-on-one-coaching',
    successMetric: "Identified issues addressed — rep's low metrics improve next period",
    warnings:
      'Metrics provide clues but not the full story. Discuss with the rep to uncover external factors.',
  },
  {
    id: 'analyze-rep-call-patterns',
    name: "Analyze rep's sales call patterns for coaching",
    description:
      'Dissects talk tracks, objection handling, and ratio metrics to fuel sharper coaching.',
    category: 'deep-research',
    funnelStage: 'one-on-one-coaching',
    successMetric: 'Higher quality sales conversations — call quality score increases',
    warnings: 'Base feedback on multiple calls. Balance critique with positives.',
  },
  {
    id: 'evaluate-rep-training-progress',
    name: "Evaluate rep's training and simulation progress",
    description:
      'Connects enablement-platform stats to on-the-job results so you can spot real skill gains.',
    category: 'deep-research',
    funnelStage: 'one-on-one-coaching',
    successMetric: "Rep's skill gaps addressed — ramp time shorter than average",
    warnings: 'Training metrics are proxies. Supplement with real-world observations.',
  },
  {
    id: 'plan-coaching-grow-model',
    name: 'Plan a coaching conversation using GROW model',
    description:
      'Gives you a ready-made flow — Goal, Reality, Options, Will — to structure a productive coaching talk.',
    category: 'execution',
    funnelStage: 'one-on-one-coaching',
    successMetric: 'Rep achieves the set Goal or shows measured improvement',
    warnings: "The goal must come from the rep too. Use GROW to facilitate the rep's ownership.",
  },
  {
    id: 'give-feedback-sbi-framework',
    name: 'Give feedback to rep using SBI framework',
    description:
      'Provides a clear Situation-Behavior-Impact script so feedback lands factually and constructively.',
    category: 'execution',
    funnelStage: 'one-on-one-coaching',
    successMetric: 'Behavior improved in subsequent similar situations',
    warnings: 'Deliver feedback privately and timely. It should be a dialogue.',
  },
  {
    id: 'prepare-1on1-agenda-template',
    name: 'Prepare 1:1 meeting agenda and notes template',
    description:
      'Creates an agenda outline that keeps weekly 1-on-1s focused, balanced, and actionable.',
    category: 'execution',
    funnelStage: 'one-on-one-coaching',
    successMetric:
      'Consistent, focused 1:1s — all key topics covered; actions completed by next meeting',
    warnings: "Don't let the agenda become rigid. Ensure the rep's concerns are heard.",
  },

  // ── onboarding-ramp (5) ──
  {
    id: 'compare-new-rep-ramp-benchmarks',
    name: "Compare new rep's ramp to benchmarks",
    description:
      "Benchmarks a new AE's ramp curve against team averages so you can intervene early if needed.",
    category: 'deep-research',
    funnelStage: 'onboarding-ramp',
    successMetric:
      'Fair assessment of ramp — triggers support if behind, shares best practices if ahead',
    warnings: 'Every rep ramps differently. Calibrate expectations to role complexity.',
  },
  {
    id: 'check-new-rep-enablement-engagement',
    name: "Check new rep's enablement engagement",
    description:
      'Reviews course completion, call-coach hours, and sim scores to confirm the rookie is dialed in.',
    category: 'deep-research',
    funnelStage: 'onboarding-ramp',
    successMetric: 'New hire completes all enablement milestones on time',
    warnings: 'Not all learning is captured in systems. Supplement with your observations.',
  },
  {
    id: 'customize-30-60-90-plan',
    name: 'Customize 30-60-90 day plan based on progress',
    description:
      'Adapts the onboarding roadmap to reality — stretch goals for fast starters, remediation for those behind.',
    category: 'execution',
    funnelStage: 'onboarding-ramp',
    successMetric: 'Rep meets ramp plan milestones. Issues identified and addressed promptly.',
    warnings: 'Use the plan flexibly. The purpose is to support, not to be an arbitrary checklist.',
  },
  {
    id: 'create-role-play-scenario',
    name: 'Create role-play scenario for skill practice',
    description:
      'Generates a realistic customer scenario with scripted objections to sharpen a specific selling skill.',
    category: 'execution',
    funnelStage: 'onboarding-ramp',
    successMetric: 'Observed improvement in target skill on the next real customer call',
    warnings: 'Ensure scenarios mirror actual sales situations. Debrief thoroughly after.',
  },
  {
    id: 'request-onboarding-feedback',
    name: 'Request onboarding feedback from new hire',
    description:
      'Sends a warm note asking for candid input so you can keep sharpening the onboarding journey.',
    category: 'execution',
    funnelStage: 'onboarding-ramp',
    successMetric:
      'Constructive feedback collected and applied — next new hire class reports higher satisfaction',
    warnings: 'New hires may be hesitant to criticize. Emphasize you want honesty.',
  },

  // ── performance-management (6) ──
  {
    id: 'diagnose-underperformance-causes',
    name: "Diagnose causes of a rep's underperformance",
    description:
      'Connects the dots between quota miss, pipeline, activity, and external factors to find root causes.',
    category: 'deep-research',
    funnelStage: 'performance-management',
    successMetric:
      'Root causes identified leading to targeted actions. Improvement seen next quarter.',
    warnings:
      'Data might not tell the whole story. Pair analysis with a conversation with the rep.',
  },
  {
    id: 'review-rep-performance-trend',
    name: "Review rep's performance trend over time",
    description:
      "Charts a rep's quota attainment quarter by quarter to spot dips, surges, or plateaus.",
    category: 'deep-research',
    funnelStage: 'performance-management',
    successMetric: 'Appropriate management action taken — performance rebounds or managed exit',
    warnings: "Past success doesn't guarantee future. Consider any changes in role or territory.",
  },
  {
    id: 'evaluate-external-factors',
    name: 'Evaluate external factors affecting rep performance',
    description:
      "Separates territory or quota issues from skill gaps so you're fair in the diagnosis.",
    category: 'deep-research',
    funnelStage: 'performance-management',
    successMetric: 'Fair evaluation — if structural issues found, adjustments made',
    warnings:
      'If multiple reps in similar territories lag, structural issues could be real. Address to maintain morale.',
  },
  {
    id: 'plan-difficult-performance-discussion',
    name: 'Plan talking points for a difficult performance discussion',
    description:
      'Gives you a calm, structured script so tough conversations stay factual and respectful.',
    category: 'execution',
    funnelStage: 'performance-management',
    successMetric: 'Clarity and agreement on performance issues and path forward',
    warnings: 'Remain calm and empathetic. Stick to facts to avoid any perception of unfairness.',
  },
  {
    id: 'draft-performance-improvement-plan',
    name: 'Draft a Performance Improvement Plan (PIP)',
    description:
      'Provides a clear, HR-ready roadmap for turning performance around — or documenting the attempt.',
    category: 'execution',
    funnelStage: 'performance-management',
    successMetric: 'PIP objectives met by deadline, or documentation supports next steps',
    warnings:
      'PIP should be fair and achievable. Genuinely support the rep through the PIP period.',
  },
  {
    id: 'setup-pip-support-monitoring',
    name: 'Set up a support & monitoring plan during PIP',
    description:
      'Outlines daily touchpoints and resources so the PIP feels like coaching, not punishment.',
    category: 'execution',
    funnelStage: 'performance-management',
    successMetric: 'Rep engagement and morale remain high enough to drive improvement',
    warnings: "Frame check-ins as collaborative, not policing. Don't neglect other team members.",
  },

  // ── churn-expansion-oversight (6) ──
  {
    id: 'summarize-recent-churn',
    name: 'Summarize recent churn and reasons',
    description:
      'Boils down who left, how much ARR walked out, and the main "why" behind each exit.',
    category: 'deep-research',
    funnelStage: 'churn-expansion-oversight',
    successMetric:
      'Churn reasons clearly understood — improvement actions lead to churn rate reduction',
    warnings:
      'Churn feedback may mask real reasons. Combine with CSM insights and product usage data.',
  },
  {
    id: 'calculate-net-retention-drivers',
    name: 'Calculate net retention and drivers',
    description:
      'Runs the math on NRR and explains whether churn or expansion is steering the ship.',
    category: 'deep-research',
    funnelStage: 'churn-expansion-oversight',
    successMetric: 'Net retention rate at or above goal (NRR >100%)',
    warnings: 'High NRR can mask churn if driven by a few huge expansions. Provide context.',
  },
  {
    id: 'review-expansion-pipeline',
    name: 'Review expansion pipeline vs targets',
    description: 'Checks whether upcoming upsell and cross-sell deals can hit the expansion quota.',
    category: 'deep-research',
    funnelStage: 'churn-expansion-oversight',
    successMetric: 'Expansion target attainment % achieved',
    warnings: 'Treat expansion deals with the same scrutiny as new deals in forecast calls.',
  },
  {
    id: 'outline-churn-reduction-plan',
    name: 'Outline a churn reduction plan with CS team',
    description:
      'Drafts a joint playbook — health scores, exec sponsors, ROI check-ins — to keep renewals safe.',
    category: 'execution',
    funnelStage: 'churn-expansion-oversight',
    successMetric: 'Churn rate reduction quarter-over-quarter (e.g., from 5% to 3%)',
    warnings: 'Execution is key. Make sure Sales-CS responsibilities are defined.',
  },
  {
    id: 'integrate-renewals-forecasting',
    name: 'Integrate renewals into forecasting process',
    description:
      'Builds renewals and churn risk into the sales forecast so revenue projections are truly full-stream.',
    category: 'execution',
    funnelStage: 'churn-expansion-oversight',
    successMetric: 'Better visibility and accuracy in overall revenue forecasting',
    warnings: 'Clarify who owns the renewal number. Be careful not to double-count expansions.',
  },
  {
    id: 'provide-expansion-sales-playbook',
    name: 'Provide expansion sales playbook guidelines',
    description:
      'Maps the end-to-end upsell motion so AEs treat expansions with the rigor of new-logo deals.',
    category: 'execution',
    funnelStage: 'churn-expansion-oversight',
    successMetric: 'Increased expansion deal conversion rate and value; higher net retention',
    warnings:
      "Don't push unwanted expansions that could hurt customer relationship. Identify genuine needs.",
  },
];

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

export function getPromptsByStage(stage: FunnelStage): PromptEntry[] {
  return PROMPT_LIBRARY.filter((p) => p.funnelStage === stage);
}

export function getPromptsByCategory(category: PromptCategory): PromptEntry[] {
  return PROMPT_LIBRARY.filter((p) => p.category === category);
}

export function searchPrompts(query: string): PromptEntry[] {
  const lower = query.toLowerCase();
  return PROMPT_LIBRARY.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower) ||
      p.id.toLowerCase().includes(lower)
  );
}

// ---------------------------------------------------------------------------
// Role-Based Access Mapping
// ---------------------------------------------------------------------------
// Maps each prompt to the roles that would use it. This determines which
// prompts appear in the PlayLibrary based on the current user's role.

export type UserRole = 'rep' | 'manager' | 'exec' | 'revops' | 'admin';

export const PROMPT_ROLE_ACCESS: Record<string, UserRole[]> = {
  // deal-strategy-review — Reps own their deals, managers coach, execs sponsor
  'flag-high-risk-deals': ['manager', 'exec', 'revops'],
  'extract-win-loss-insights': ['manager', 'exec'],
  'assess-meddic-completeness': ['rep', 'manager'],
  'create-win-strategy-plan': ['rep', 'manager'],
  'prepare-executive-summary-deal': ['rep', 'manager', 'exec'],
  'document-lost-deal-sbi': ['rep', 'manager'],

  // forecasting — Managers own forecast, execs review, RevOps validates
  'quarter-end-closing-strategy': ['manager'],
  'summarize-forecast-for-execs': ['manager', 'exec'],
  'mitigation-plan-forecast-shortfall': ['manager', 'exec'],
  'find-largest-forecast-variances': ['manager', 'exec', 'revops'],
  'identify-historical-forecast-bias': ['manager', 'exec', 'revops'],
  'compare-commit-pipeline-ai-forecast': ['manager', 'exec', 'revops'],

  // pipeline-management — Managers drive pipeline, RevOps measures, reps update
  'request-pipeline-data-update': ['rep', 'manager', 'revops'],
  'align-marketing-pipeline-gaps': ['manager', 'exec'],
  'plan-pipeline-generation-boost': ['manager'],
  'benchmark-team-metrics': ['manager', 'revops'],
  'spot-stagnant-deals': ['manager', 'revops'],
  'identify-pipeline-coverage-gaps': ['manager', 'exec', 'revops'],

  // pipeline-review-meeting — Manager-led cadence, RevOps supports with data
  'summarize-weekly-pipeline-changes': ['manager', 'revops'],
  'find-stalled-deals-pipeline-call': ['manager', 'revops'],
  'highlight-top-opportunities': ['manager', 'exec'],
  'set-pipeline-review-agenda': ['manager'],
  'send-pipeline-meeting-followup': ['manager'],
  'provide-rep-pipeline-scorecards': ['manager', 'revops'],

  // forecast-meeting — Managers present, execs challenge, RevOps validates
  'consolidate-team-forecast': ['manager', 'exec'],
  'explain-week-over-week-forecast-changes': ['manager', 'exec'],
  'review-commit-deals-risk-signals': ['manager', 'exec'],
  'organize-forecast-call-agenda': ['manager'],
  'advise-forecast-adjustments': ['manager', 'exec'],
  'share-post-forecast-call-update': ['manager', 'exec'],

  // quarterly-business-review — Manager + Exec strategic alignment
  'recap-quarterly-performance': ['manager', 'exec'],
  'analyze-quarterly-performance-drivers': ['manager', 'exec'],
  'compare-team-rep-performance': ['manager', 'exec'],
  'outline-qbr-presentation': ['manager', 'exec'],
  'propose-next-quarter-initiatives': ['manager', 'exec'],
  'draft-qbr-executive-summary': ['manager', 'exec'],

  // executive-reporting-monthly — Exec audience, RevOps builds reports
  'compile-monthly-sales-snapshot': ['manager', 'exec', 'revops'],
  'detect-early-warning-signals': ['manager', 'exec', 'revops'],
  'highlight-monthly-wins-challenges': ['manager', 'exec'],
  'draft-monthly-performance-email': ['manager', 'exec'],
  'provide-bi-dashboard-commentary': ['revops'],
  'update-rolling-forecast-request-support': ['manager', 'exec'],

  // one-on-one-coaching — Manager-only coaching cadence
  'summarize-rep-performance': ['manager'],
  'analyze-rep-call-patterns': ['manager'],
  'evaluate-rep-training-progress': ['manager'],
  'plan-coaching-grow-model': ['manager'],
  'give-feedback-sbi-framework': ['manager'],
  'prepare-1on1-agenda-template': ['manager'],

  // onboarding-ramp — Reps experience it, managers drive it
  'compare-new-rep-ramp-benchmarks': ['rep', 'manager'],
  'check-new-rep-enablement-engagement': ['rep', 'manager'],
  'customize-30-60-90-plan': ['manager'],
  'create-role-play-scenario': ['rep', 'manager'],
  'request-onboarding-feedback': ['rep', 'manager'],

  // performance-management — Manager-owned, RevOps supports with data
  'diagnose-underperformance-causes': ['manager'],
  'review-rep-performance-trend': ['manager'],
  'evaluate-external-factors': ['manager', 'revops'],
  'plan-difficult-performance-discussion': ['manager'],
  'draft-performance-improvement-plan': ['manager'],
  'setup-pip-support-monitoring': ['manager'],

  // churn-expansion-oversight — Cross-functional: manager, exec, RevOps
  'summarize-recent-churn': ['manager', 'exec'],
  'calculate-net-retention-drivers': ['manager', 'exec', 'revops'],
  'review-expansion-pipeline': ['manager', 'exec', 'revops'],
  'outline-churn-reduction-plan': ['manager', 'exec'],
  'integrate-renewals-forecasting': ['manager', 'revops'],
  'provide-expansion-sales-playbook': ['manager'],
};

// ---------------------------------------------------------------------------
// Dashboard Feature Reverse-Engineering
// ---------------------------------------------------------------------------
// Maps prompts whose analytical logic is already embedded in dashboard
// components. These links show users "this AI prompt powers this view."

export interface DashboardFeatureLink {
  page: string;
  pageName: string;
  component: string;
  description: string;
}

export const PROMPT_DASHBOARD_LINKS: Record<string, DashboardFeatureLink> = {
  'flag-high-risk-deals': {
    page: '/risk',
    pageName: 'Risk Monitor',
    component: 'RiskClusters',
    description:
      'Risk clusters auto-flag deals by pattern: single-stakeholder, stalled, low-fit, and discount risk',
  },
  'spot-stagnant-deals': {
    page: '/risk',
    pageName: 'Risk Monitor',
    component: 'RiskClusters',
    description: '"Stalled After Proposal" cluster identifies deals stuck 20+ days in stage',
  },
  'identify-pipeline-coverage-gaps': {
    page: '/',
    pageName: 'Command Center',
    component: 'Pipeline Coverage',
    description: 'Pipeline coverage ratio displayed in header metrics (target: 3x)',
  },
  'summarize-forecast-for-execs': {
    page: '/',
    pageName: 'Command Center',
    component: 'ForecastBand',
    description: 'Quality-adjusted forecast with confidence band visible on dashboard',
  },
  'compare-commit-pipeline-ai-forecast': {
    page: '/',
    pageName: 'Command Center',
    component: 'ForecastBand',
    description: 'Raw vs AI-adjusted forecast with confidence range comparison',
  },
  'assess-meddic-completeness': {
    page: '/deals',
    pageName: 'Deal Inspector',
    component: 'DealDrawer',
    description:
      'Deal drawer shows persona gaps + missing process steps as MEDDIC completeness check',
  },
  'provide-rep-pipeline-scorecards': {
    page: '/team',
    pageName: 'Team Performance',
    component: 'Team Page',
    description: 'Individual rep cards show quota attainment, pipeline value, and deal count',
  },
  'highlight-top-opportunities': {
    page: '/deals',
    pageName: 'Deal Inspector',
    component: 'DealTable',
    description: 'Deal table sortable by ACV and PQ Score to spotlight top opportunities',
  },
  'detect-early-warning-signals': {
    page: '/settings',
    pageName: 'Settings',
    component: 'AlertThresholdEditor',
    description: 'Configurable alert thresholds trigger warnings when metrics cross boundaries',
  },
  'summarize-rep-performance': {
    page: '/team',
    pageName: 'Team Performance',
    component: 'Team Page',
    description: 'Rep performance summary with quota attainment and pipeline health metrics',
  },
  'find-stalled-deals-pipeline-call': {
    page: '/coaching',
    pageName: 'Coaching Engine',
    component: 'InterventionQueue',
    description: 'Intervention queue surfaces low-PQS, high-ACV deals needing immediate attention',
  },
  'create-win-strategy-plan': {
    page: '/coaching',
    pageName: 'Coaching Engine',
    component: 'DealDrawer / Next Actions',
    description: 'AI-generated next actions per deal based on stage, gaps, and risk signals',
  },
  'diagnose-underperformance-causes': {
    page: '/team',
    pageName: 'Team Performance',
    component: 'Team Page',
    description:
      'Rep metrics (quota %, pipeline value, win rate) help diagnose underperformance root causes',
  },
  'consolidate-team-forecast': {
    page: '/',
    pageName: 'Command Center',
    component: 'ForecastBand',
    description: 'Aggregated team forecast with quality adjustment and confidence interval',
  },
  'review-commit-deals-risk-signals': {
    page: '/risk',
    pageName: 'Risk Monitor',
    component: 'RiskClusters',
    description: 'Risk signals surfaced through cluster analysis of commit-stage deals',
  },
};

// ---------------------------------------------------------------------------
// Enhanced Helper Functions
// ---------------------------------------------------------------------------

export function getPromptsForRole(role: UserRole): PromptEntry[] {
  return PROMPT_LIBRARY.filter((p) => {
    const roles = PROMPT_ROLE_ACCESS[p.id];
    return roles ? roles.includes(role) : false;
  });
}

export function getDashboardLink(promptId: string): DashboardFeatureLink | undefined {
  return PROMPT_DASHBOARD_LINKS[promptId];
}

export function getRolesForPrompt(promptId: string): UserRole[] {
  return PROMPT_ROLE_ACCESS[promptId] ?? [];
}

/** Count prompts available for a given role, optionally filtered by stage */
export function countPromptsForRole(role: UserRole, stage?: FunnelStage): number {
  return PROMPT_LIBRARY.filter((p) => {
    const roles = PROMPT_ROLE_ACCESS[p.id];
    if (!roles || !roles.includes(role)) return false;
    if (stage && p.funnelStage !== stage) return false;
    return true;
  }).length;
}
