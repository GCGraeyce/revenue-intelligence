import { Deal } from '@/data/demo-data';
import { BUYER_PERSONAS, type BuyerPersona } from '@/data/evercam-context';
import { getAccountByName, getContactsForAccount, type Contact } from '@/data/deep-accounts';
import { cn } from '@/lib/utils';
import {
  User, UserCheck, UserX, AlertTriangle, ChevronDown, ChevronUp,
  Mail, Phone, Linkedin, Building2, Star,
} from 'lucide-react';
import { useState } from 'react';

interface StakeholderStatus {
  persona: BuyerPersona;
  engaged: boolean;
  shouldBeActive: boolean;
  critical: boolean;
  contacts: Contact[]; // Real people mapped to this persona
}

function mapContactsToPersonas(contacts: Contact[], _deal: Deal): Map<string, Contact[]> {
  const map = new Map<string, Contact[]>();
  // Map contact roles to persona roles
  const roleToPersona: Record<string, string> = {
    'champion': 'Champion',
    'economic-buyer': 'Economic Buyer',
    'technical-evaluator': 'Technical Evaluator',
    'end-user': 'End User',
    'blocker': 'Gatekeeper',
    'influencer': 'Influencer',
    'coach': 'Coach',
  };
  // Map by buyer persona string match
  for (const contact of contacts) {
    const personaKey = roleToPersona[contact.role] || contact.buyerPersona;
    if (!map.has(personaKey)) map.set(personaKey, []);
    map.get(personaKey)!.push(contact);
  }
  return map;
}

function getStakeholderStatuses(deal: Deal): StakeholderStatus[] {
  // Look up real contacts for this deal's account
  const account = getAccountByName(deal.company);
  const realContacts = account ? getContactsForAccount(account.id) : [];
  const contactsByPersona = mapContactsToPersonas(realContacts, deal);

  return BUYER_PERSONAS.map(persona => {
    const gapMatch = deal.personaGaps.some(gap =>
      gap.toLowerCase().includes(persona.role.toLowerCase()) ||
      persona.role.toLowerCase().includes(gap.toLowerCase().replace('no ', '').replace('missing ', ''))
    );
    const engaged = !gapMatch;
    const shouldBeActive = persona.activeStages.includes(deal.stage);
    const critical = persona.importance >= 4 && shouldBeActive && !engaged;

    // Find contacts matching this persona (by role name or buyer persona string)
    const matchedContacts = contactsByPersona.get(persona.role) ||
      contactsByPersona.get(persona.title) ||
      realContacts.filter(c => c.buyerPersona.toLowerCase().includes(persona.role.toLowerCase().split(' ')[0])) ||
      [];

    return { persona, engaged, shouldBeActive, critical, contacts: matchedContacts };
  });
}

function ContactCard({ contact }: { contact: Contact }) {
  const sentimentColor = contact.engagement.sentiment === 'positive' ? 'grade-a'
    : contact.engagement.sentiment === 'negative' ? 'grade-f' : 'grade-c';
  const strengthStars = '★'.repeat(contact.relationshipStrength) + '☆'.repeat(5 - contact.relationshipStrength);

  return (
    <div className="bg-card/80 border border-border/20 rounded-lg p-2.5 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
          {contact.firstName[0]}{contact.lastName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-foreground truncate">{contact.fullName}</div>
          <div className="text-[10px] text-muted-foreground truncate">{contact.title}</div>
        </div>
        {contact.status === 'left-company' && (
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-[hsl(var(--grade-f)/.1)] text-[hsl(var(--grade-f))]">Left</span>
        )}
        {contact.status === 'do-not-contact' && (
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-[hsl(var(--grade-f)/.1)] text-[hsl(var(--grade-f))]">DNC</span>
        )}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Building2 className="w-2.5 h-2.5" />
          <span>{contact.department}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-[hsl(var(--${sentimentColor}))]`}>●</span>
          <span className="capitalize">{contact.engagement.sentiment}</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-2.5 h-2.5" />
          <span className="font-mono">{strengthStars}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px]">
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="flex items-center gap-0.5 text-primary hover:underline">
            <Mail className="w-2.5 h-2.5" /> Email
          </a>
        )}
        {contact.phone && (
          <span className="flex items-center gap-0.5 text-muted-foreground">
            <Phone className="w-2.5 h-2.5" /> {contact.phone.slice(0, 12)}...
          </span>
        )}
        {contact.linkedin && (
          <a href={contact.linkedin} className="flex items-center gap-0.5 text-primary hover:underline">
            <Linkedin className="w-2.5 h-2.5" /> Profile
          </a>
        )}
      </div>

      <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground border-t border-border/10 pt-1.5">
        <span>{contact.engagement.totalMeetings} mtgs</span>
        <span>{contact.engagement.totalEmails} emails</span>
        <span>{contact.engagement.totalCalls} calls</span>
        <span className="ml-auto">Last: {contact.engagement.lastContactDate}</span>
      </div>

      {contact.decisionAuthority === 'final-approver' && (
        <div className="text-[9px] font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded">
          Final Approver — {contact.preferredContactMethod} preferred
        </div>
      )}
    </div>
  );
}

function PersonaNode({ status, expanded, onToggle }: {
  status: StakeholderStatus;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { persona, engaged, shouldBeActive, critical, contacts } = status;
  const importanceStars = '●'.repeat(persona.importance) + '○'.repeat(5 - persona.importance);

  const borderColor = critical ? 'border-[hsl(var(--grade-f))]' :
    engaged ? 'border-[hsl(var(--grade-a)/.5)]' :
    shouldBeActive ? 'border-[hsl(var(--grade-c)/.5)]' :
    'border-border/30';

  const bgColor = critical ? 'bg-[hsl(var(--grade-f)/.05)]' :
    engaged ? 'bg-[hsl(var(--grade-a)/.03)]' :
    'bg-secondary/30';

  return (
    <div className={cn('rounded-lg border-2 overflow-hidden transition-all', borderColor, bgColor)}>
      <div
        className="flex items-center gap-2.5 p-3 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={onToggle}
      >
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          engaged ? 'bg-[hsl(var(--grade-a)/.15)]' : critical ? 'bg-[hsl(var(--grade-f)/.15)]' : 'bg-muted'
        )}>
          {engaged ? (
            <UserCheck className="w-4 h-4 text-[hsl(var(--grade-a))]" />
          ) : critical ? (
            <UserX className="w-4 h-4 text-[hsl(var(--grade-f))]" />
          ) : (
            <User className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">{persona.role}</span>
            {critical && <AlertTriangle className="w-3 h-3 text-[hsl(var(--grade-f))]" />}
            {contacts.length > 0 && (
              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-primary/10 text-primary">
                {contacts.length} contact{contacts.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono truncate">
            {contacts.length > 0 ? contacts[0].fullName + (contacts.length > 1 ? ` +${contacts.length - 1}` : '') : persona.title}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn(
            'text-[9px] font-mono px-1.5 py-0.5 rounded',
            engaged ? 'bg-[hsl(var(--grade-a)/.1)] text-[hsl(var(--grade-a))]' :
            critical ? 'bg-[hsl(var(--grade-f)/.1)] text-[hsl(var(--grade-f))]' :
            'bg-muted text-muted-foreground'
          )}>
            {engaged ? 'Engaged' : shouldBeActive ? 'Missing' : 'Not Yet'}
          </span>
          <span className="text-[8px] font-mono text-muted-foreground tracking-tight">{importanceStars}</span>
          {expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/20 pt-2 animate-fade-in">
          {/* Real contacts for this persona */}
          {contacts.length > 0 && (
            <div>
              <div className="text-[9px] uppercase tracking-widest text-primary font-semibold mb-1.5">
                Identified Contacts
              </div>
              <div className="space-y-1.5">
                {contacts.map(c => (
                  <ContactCard key={c.id} contact={c} />
                ))}
              </div>
            </div>
          )}

          {/* Active stages */}
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Active Stages</div>
            <div className="flex gap-1">
              {['Discovery', 'Qualification', 'Proposal', 'Negotiation'].map(stage => (
                <span key={stage} className={cn(
                  'text-[9px] font-mono px-1.5 py-0.5 rounded',
                  persona.activeStages.includes(stage)
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted/50 text-muted-foreground/50'
                )}>
                  {stage.slice(0, 4)}
                </span>
              ))}
            </div>
          </div>

          {/* Priorities */}
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Their Priorities</div>
            {persona.priorities.slice(0, 3).map((p, i) => (
              <div key={i} className="text-[11px] text-foreground flex items-start gap-1 mb-0.5">
                <span className="text-primary/60">•</span> {p}
              </div>
            ))}
          </div>

          {/* If not engaged, show engagement tips */}
          {!engaged && shouldBeActive && (
            <div>
              <div className="text-[9px] uppercase tracking-widest text-[hsl(var(--grade-a))] font-semibold mb-1">How to Engage</div>
              {persona.engagementTips.slice(0, 2).map((t, i) => (
                <div key={i} className="text-[11px] text-foreground flex items-start gap-1 mb-0.5">
                  <span className="text-[hsl(var(--grade-a))]">→</span> {t}
                </div>
              ))}
            </div>
          )}

          {/* Common objections */}
          {engaged && (
            <div>
              <div className="text-[9px] uppercase tracking-widest text-[hsl(var(--grade-c))] font-semibold mb-1">Watch For Objections</div>
              {persona.objections.slice(0, 2).map((o, i) => (
                <div key={i} className="text-[11px] text-muted-foreground flex items-start gap-1 mb-0.5">
                  <span className="text-[hsl(var(--grade-c))]">!</span> {o}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function StakeholderMap({ deal }: { deal: Deal }) {
  const statuses = getStakeholderStatuses(deal);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const engagedCount = statuses.filter(s => s.engaged).length;
  const criticalGaps = statuses.filter(s => s.critical).length;
  const coveragePct = Math.round((engagedCount / statuses.length) * 100);
  const totalContacts = statuses.reduce((s, st) => s + st.contacts.length, 0);

  const coverageColor = coveragePct >= 80 ? 'grade-a' : coveragePct >= 60 ? 'grade-c' : 'grade-f';

  return (
    <div className="space-y-3">
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Buying Committee
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('text-sm font-mono font-bold', `text-[hsl(var(--${coverageColor}))]`)}>
            {coveragePct}% coverage
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {engagedCount}/{statuses.length} engaged
          </span>
          {totalContacts > 0 && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {totalContacts} people
            </span>
          )}
          {criticalGaps > 0 && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[hsl(var(--grade-f)/.1)] text-[hsl(var(--grade-f))]">
              {criticalGaps} critical gap{criticalGaps > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Coverage bar */}
      <div className="flex gap-1 h-2 rounded-full overflow-hidden">
        {statuses.map((s, i) => (
          <div
            key={i}
            className={cn(
              'h-full flex-1 rounded-full transition-all',
              s.engaged ? 'bg-[hsl(var(--grade-a))]' :
              s.critical ? 'bg-[hsl(var(--grade-f))]' :
              'bg-muted'
            )}
            title={`${s.persona.role}: ${s.engaged ? 'Engaged' : s.critical ? 'Critical Gap' : 'Not Active'}${s.contacts.length > 0 ? ` — ${s.contacts.map(c => c.fullName).join(', ')}` : ''}`}
          />
        ))}
      </div>

      {/* Persona cards */}
      <div className="space-y-2">
        {statuses.map((status, i) => (
          <PersonaNode
            key={status.persona.id}
            status={status}
            expanded={expandedIdx === i}
            onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
          />
        ))}
      </div>
    </div>
  );
}
