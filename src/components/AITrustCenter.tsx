import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import {
  Shield, Eye, Lock, AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  Scale, Brain, FileCheck, Users, Fingerprint,
} from 'lucide-react';

/* ─── Bias Validation Metrics ─── */
interface BiasMetric {
  dimension: string;
  description: string;
  status: 'pass' | 'warning' | 'fail';
  value: string;
  detail: string;
}

const BIAS_METRICS: BiasMetric[] = [
  {
    dimension: 'Segment Parity',
    description: 'PQS scoring consistency across SMB, Mid-Market, Enterprise segments',
    status: 'pass',
    value: '±2.3%',
    detail: 'Average PQS deviation across segments is within acceptable ±5% threshold. Enterprise deals average PQS 54, Mid-Market 52, SMB 51.',
  },
  {
    dimension: 'Rep Fairness',
    description: 'Scoring does not systematically favour or penalise individual reps',
    status: 'pass',
    value: '±1.8%',
    detail: 'No single rep has a systematic PQS deviation >3% from team mean when controlling for deal characteristics. Kolmogorov-Smirnov test p=0.84.',
  },
  {
    dimension: 'Source Neutrality',
    description: 'Inbound vs Outbound vs Partner deals scored without channel bias',
    status: 'warning',
    value: '±4.7%',
    detail: 'Outbound deals score 4.7% lower on average. Root cause: lower ICP fit on cold outreach is a legitimate signal, not bias. Monitoring.',
  },
  {
    dimension: 'Temporal Stability',
    description: 'Scoring consistency over time (no drift or recency bias)',
    status: 'pass',
    value: '±1.2%',
    detail: 'Monthly PQS distribution is statistically stable (chi-squared test p=0.91). No evidence of recency bias in engagement scoring.',
  },
  {
    dimension: 'Forecast Calibration',
    description: 'Predicted win probabilities match actual historical outcomes',
    status: 'warning',
    value: '7.2% off',
    detail: 'Discovery stage predictions are 7.2% too optimistic vs historical close rates. Scheduled recalibration for next model update.',
  },
];

/* ─── AI Guardrails ─── */
interface Guardrail {
  name: string;
  description: string;
  enforced: boolean;
  category: 'data' | 'decision' | 'access' | 'audit';
}

const GUARDRAILS: Guardrail[] = [
  { name: 'Human-in-the-Loop for Tier 2+ Actions', description: 'Manager approval required before AI executes coaching actions that affect deals (stage changes, customer communication, pricing)', enforced: true, category: 'decision' },
  { name: 'No Automated Customer Contact', description: 'AI never directly contacts customers. All outreach requires rep approval and initiation', enforced: true, category: 'decision' },
  { name: 'Score Override Audit Trail', description: 'Any manual PQS override is logged with timestamp, user, original value, new value, and justification', enforced: true, category: 'audit' },
  { name: 'PII Minimisation', description: 'Contact names and emails are not used in scoring models. Only role, engagement frequency, and stage data flow into PQS', enforced: true, category: 'data' },
  { name: 'GDPR Data Retention', description: 'Deal data older than 36 months automatically anonymised. Activity data purged after 24 months per retention policy', enforced: true, category: 'data' },
  { name: 'Role-Based Data Access', description: 'Reps see own deals only. Managers see team. Execs see org. RevOps sees system config. Enforced at API and UI layers', enforced: true, category: 'access' },
  { name: 'Model Explainability Requirement', description: 'Every PQS score must be decomposable into weighted dimensions. No black-box scoring allowed', enforced: true, category: 'decision' },
  { name: 'Bias Monitoring Threshold', description: 'Automated alerts if any bias metric exceeds ±5% deviation. Blocks model deployment if >±10%', enforced: true, category: 'audit' },
  { name: 'Forecast Confidence Bands', description: 'All AI forecasts include Low/Mid/High confidence bands. Point estimates are never shown without uncertainty range', enforced: true, category: 'decision' },
  { name: 'SOC 2 Type II Compliance', description: 'Annual audit of security controls, access management, and data handling practices', enforced: true, category: 'access' },
];

/* ─── Security Standards ─── */
interface SecurityStandard {
  name: string;
  status: 'compliant' | 'in-progress' | 'planned';
  detail: string;
}

const SECURITY_STANDARDS: SecurityStandard[] = [
  { name: 'SOC 2 Type II', status: 'compliant', detail: 'Certified. Annual audit by Deloitte. Last audit: Dec 2025.' },
  { name: 'GDPR (EU)', status: 'compliant', detail: 'Data Processing Agreement in place. DPO appointed. Privacy Impact Assessment completed.' },
  { name: 'ISO 27001', status: 'compliant', detail: 'Certified ISMS. Covers all production systems and data handling processes.' },
  { name: 'OWASP Top 10', status: 'compliant', detail: 'Regular penetration testing. All API endpoints hardened against injection, XSS, CSRF.' },
  { name: 'Data Encryption', status: 'compliant', detail: 'AES-256 at rest, TLS 1.3 in transit. Database encryption with customer-managed keys option.' },
  { name: 'SSO / MFA', status: 'compliant', detail: 'SAML 2.0 and OIDC SSO. MFA enforced for all admin/revops roles.' },
  { name: 'AI Act (EU)', status: 'in-progress', detail: 'Risk classification assessment underway. PQS scoring categorised as limited-risk AI system.' },
  { name: 'Penetration Testing', status: 'compliant', detail: 'Quarterly pen tests by independent security firm. Zero critical findings in last 4 quarters.' },
];

const categoryIcons = {
  data: Lock,
  decision: Brain,
  access: Fingerprint,
  audit: FileCheck,
};

const categoryLabels = {
  data: 'Data Protection',
  decision: 'Decision Guardrails',
  access: 'Access Control',
  audit: 'Audit & Monitoring',
};

function BiasCard({ metric }: { metric: BiasMetric }) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = metric.status === 'pass' ? 'grade-a' : metric.status === 'warning' ? 'grade-c' : 'grade-f';

  return (
    <div className="rounded-lg border border-border/30 overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {metric.status === 'pass'
          ? <CheckCircle className="w-4 h-4 text-[hsl(var(--grade-a))] flex-shrink-0" />
          : <AlertTriangle className="w-4 h-4 text-[hsl(var(--grade-c))] flex-shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">{metric.dimension}</div>
          <div className="text-[10px] text-muted-foreground">{metric.description}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn('text-xs font-mono font-bold', `text-[hsl(var(--${statusColor}))]`)}>
            {metric.value}
          </span>
          <span className={cn(
            'text-[9px] font-mono px-1.5 py-0.5 rounded uppercase',
            `bg-[hsl(var(--${statusColor})/.1)] text-[hsl(var(--${statusColor}))]`
          )}>
            {metric.status}
          </span>
          {expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
        </div>
      </div>
      {expanded && (
        <div className="px-3 pb-3 border-t border-border/20 pt-2 animate-fade-in">
          <p className="text-xs text-foreground leading-relaxed">{metric.detail}</p>
        </div>
      )}
    </div>
  );
}

export function AITrustCenter() {
  const { role } = useRole();
  const [activeSection, setActiveSection] = useState<'bias' | 'guardrails' | 'security' | 'explainability'>('bias');

  const sections = [
    { id: 'bias' as const, label: 'Bias Validation', icon: Scale },
    { id: 'guardrails' as const, label: 'AI Guardrails', icon: Shield },
    { id: 'security' as const, label: 'Security & Compliance', icon: Lock },
    { id: 'explainability' as const, label: 'Explainability', icon: Eye },
  ];

  const passCount = BIAS_METRICS.filter(m => m.status === 'pass').length;
  const guardCategories = ['decision', 'data', 'access', 'audit'] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">AI Trust Center</h2>
              <p className="text-[10px] font-mono text-muted-foreground">Bias validation · Guardrails · Compliance · Explainability</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono px-2 py-1 rounded bg-[hsl(var(--grade-a)/.1)] text-[hsl(var(--grade-a))]">
              {passCount}/{BIAS_METRICS.length} BIAS CHECKS PASS
            </span>
            <span className="text-[9px] font-mono px-2 py-1 rounded bg-[hsl(var(--grade-a)/.1)] text-[hsl(var(--grade-a))]">
              {GUARDRAILS.filter(g => g.enforced).length}/{GUARDRAILS.length} GUARDRAILS ACTIVE
            </span>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex bg-secondary/50 rounded-lg p-0.5">
          {sections.map(sec => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md transition-colors',
                  activeSection === sec.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-3 h-3" />
                {sec.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bias Validation */}
      {activeSection === 'bias' && (
        <div className="glass-card p-5 space-y-3">
          <div className="metric-label flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            Bias Validation Results
          </div>
          <p className="text-xs text-muted-foreground">
            Automated bias checks run daily to ensure PQS scoring is fair across segments, reps, and channels.
            Threshold: ±5% deviation triggers a warning, ±10% blocks model deployment.
          </p>
          <div className="space-y-2">
            {BIAS_METRICS.map(metric => (
              <BiasCard key={metric.dimension} metric={metric} />
            ))}
          </div>
        </div>
      )}

      {/* AI Guardrails */}
      {activeSection === 'guardrails' && (
        <div className="glass-card p-5 space-y-4">
          <div className="metric-label flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            AI Guardrails & Governance
          </div>
          <p className="text-xs text-muted-foreground">
            Controls ensuring AI is used appropriately — no autonomous customer contact, mandatory human approval for high-impact actions,
            full audit trails, and data minimisation.
          </p>
          {guardCategories.map(cat => {
            const Icon = categoryIcons[cat];
            const catGuardrails = GUARDRAILS.filter(g => g.category === cat);
            return (
              <div key={cat}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                    {categoryLabels[cat]}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {catGuardrails.map(g => (
                    <div key={g.name} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/30">
                      <CheckCircle className="w-3.5 h-3.5 text-[hsl(var(--grade-a))] mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-foreground">{g.name}</div>
                        <div className="text-[10px] text-muted-foreground">{g.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Security & Compliance */}
      {activeSection === 'security' && (
        <div className="glass-card p-5 space-y-3">
          <div className="metric-label flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Security & Compliance Standards
          </div>
          <p className="text-xs text-muted-foreground">
            Industry-standard certifications and compliance measures protecting your data.
          </p>
          <div className="space-y-2">
            {SECURITY_STANDARDS.map(std => {
              const statusColor = std.status === 'compliant' ? 'grade-a' : std.status === 'in-progress' ? 'grade-c' : 'grade-d';
              return (
                <div key={std.name} className="flex items-start gap-3 p-3 rounded-lg border border-border/30">
                  {std.status === 'compliant'
                    ? <CheckCircle className="w-4 h-4 text-[hsl(var(--grade-a))] mt-0.5 flex-shrink-0" />
                    : <AlertTriangle className="w-4 h-4 text-[hsl(var(--grade-c))] mt-0.5 flex-shrink-0" />
                  }
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{std.name}</span>
                      <span className={cn(
                        'text-[9px] font-mono px-1.5 py-0.5 rounded uppercase',
                        `bg-[hsl(var(--${statusColor})/.1)] text-[hsl(var(--${statusColor}))]`
                      )}>
                        {std.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{std.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explainability */}
      {activeSection === 'explainability' && (
        <div className="glass-card p-5 space-y-4">
          <div className="metric-label flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Scoring Explainability
          </div>
          <p className="text-xs text-muted-foreground">
            Every PQS score is fully decomposable. No black-box models. Users can toggle "Explain Scoring" mode
            to see exactly how each dimension contributes.
          </p>

          <div className="space-y-3">
            <div className="rounded-lg border border-primary/20 p-4 bg-primary/5">
              <h4 className="text-sm font-semibold text-foreground mb-2">How PQS Scoring Works</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-mono font-bold w-6">30%</span>
                  <div><strong className="text-foreground">Outcome Probability</strong> — ML-based win/loss prediction from engagement signals, stage velocity, and historical patterns</div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-mono font-bold w-6">20%</span>
                  <div><strong className="text-foreground">ICP Fit</strong> — Firmographic and technographic alignment against Evercam ideal customer profiles</div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-mono font-bold w-6">15%</span>
                  <div><strong className="text-foreground">Persona Coverage</strong> — Multi-threading across buying committee (PM, Safety, EB, IT, Exec)</div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-mono font-bold w-6">15%</span>
                  <div><strong className="text-foreground">Process Adherence</strong> — MEDDPICC milestone completion per stage</div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-mono font-bold w-6">10%</span>
                  <div><strong className="text-foreground">Engagement Velocity</strong> — Recency and frequency of buyer engagement signals</div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-mono font-bold w-6">5%</span>
                  <div><strong className="text-foreground">Price Risk</strong> — Probability of excessive discounting (partially captured in outcome model)</div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-mono font-bold w-6">5%</span>
                  <div><strong className="text-foreground">Stage Progression</strong> — Velocity through pipeline vs expected cadence</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/30 p-4">
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                User Controls
              </h4>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-[hsl(var(--grade-a))] mt-0.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Explain Mode</strong> — Toggle on any page to see scoring breakdowns per deal</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-[hsl(var(--grade-a))] mt-0.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Score Radar</strong> — Visual PQS dimension breakdown in every deal detail view</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-[hsl(var(--grade-a))] mt-0.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Weight Configuration</strong> — RevOps can adjust scoring weights with AI-proposed values based on historical outcomes</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-[hsl(var(--grade-a))] mt-0.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Confidence Bands</strong> — All forecasts include Low/Mid/High ranges, never just point estimates</span>
                </div>
              </div>
            </div>

            {role === 'revops' && (
              <div className="rounded-lg border border-[hsl(var(--grade-c)/.3)] p-4 bg-[hsl(var(--grade-c)/.03)]">
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-[hsl(var(--grade-c))]" />
                  RevOps: Model Governance
                </h4>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p>As RevOps, you can:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Adjust PQS weights in <strong>Settings → PQS Weight Configuration</strong></li>
                    <li>Review AI-proposed weight changes based on pipeline outcome analysis</li>
                    <li>Trigger model recalibration from the <strong>Model Health</strong> page</li>
                    <li>View bias validation reports and set alert thresholds</li>
                    <li>Export full scoring audit trail for compliance reviews</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
