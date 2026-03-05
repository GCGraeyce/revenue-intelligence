import { useState, useEffect, useCallback } from 'react';
import { useRole } from '@/contexts/RoleContext';
import {
  StickyNote, Plus, CheckSquare, Square, Clock,
  ChevronDown, ChevronUp, X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NoteEntry {
  id: string;
  text: string;
  createdAt: string;
  completed: boolean;
  category: 'note' | 'action' | 'follow-up';
}

interface UserPadState {
  notes: NoteEntry[];
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Persistence (localStorage)
// ---------------------------------------------------------------------------

function storageKey(user: string): string {
  return `revos-notepad-${user.replace(/\s+/g, '-').toLowerCase()}`;
}

function loadPad(user: string): UserPadState {
  try {
    const raw = localStorage.getItem(storageKey(user));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { notes: [], lastUpdated: new Date().toISOString() };
}

function savePad(user: string, state: UserPadState) {
  localStorage.setItem(storageKey(user), JSON.stringify(state));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { value: 'action' as const, label: 'Action', color: 'text-primary bg-primary/10' },
  { value: 'follow-up' as const, label: 'Follow-up', color: 'text-amber-400 bg-amber-400/10' },
  { value: 'note' as const, label: 'Note', color: 'text-muted-foreground bg-muted/50' },
];

export function UserNotepad() {
  const { currentRep } = useRole();
  const [pad, setPad] = useState<UserPadState>(() => loadPad(currentRep));
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<NoteEntry['category']>('action');
  const [expanded, setExpanded] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all');

  // Reload when rep changes
  useEffect(() => {
    setPad(loadPad(currentRep));
  }, [currentRep]);

  // Persist on every change
  useEffect(() => {
    savePad(currentRep, pad);
  }, [currentRep, pad]);

  const addNote = useCallback(() => {
    if (!newText.trim()) return;
    setPad(prev => ({
      notes: [
        {
          id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text: newText.trim(),
          createdAt: new Date().toISOString(),
          completed: false,
          category: newCategory,
        },
        ...prev.notes,
      ],
      lastUpdated: new Date().toISOString(),
    }));
    setNewText('');
  }, [newText, newCategory]);

  const toggleComplete = useCallback((id: string) => {
    setPad(prev => ({
      notes: prev.notes.map(n => n.id === id ? { ...n, completed: !n.completed } : n),
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const removeNote = useCallback((id: string) => {
    setPad(prev => ({
      notes: prev.notes.filter(n => n.id !== id),
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const filteredNotes = pad.notes.filter(n => {
    if (filter === 'open') return !n.completed;
    if (filter === 'done') return n.completed;
    return true;
  });

  const openCount = pad.notes.filter(n => !n.completed).length;
  const doneCount = pad.notes.filter(n => n.completed).length;

  return (
    <div className="glass-card animate-fade-in">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            My Actions & Notes
          </span>
          {openCount > 0 && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {openCount} open
            </span>
          )}
          {doneCount > 0 && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-grade-a/10 text-grade-a">
              {doneCount} done
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Add new */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setNewCategory(cat.value)}
                  className={`text-[9px] font-mono px-2 py-1 rounded-md transition-colors ${
                    newCategory === cat.value ? cat.color + ' border border-current/20' : 'text-muted-foreground bg-muted/30'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNote()}
              placeholder="Add action, follow-up, or note..."
              className="flex-1 text-xs bg-secondary/50 border border-border/30 rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground/50"
            />
            <button
              onClick={addNote}
              disabled={!newText.trim()}
              className="text-[10px] font-mono px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>

          {/* Filter tabs */}
          {pad.notes.length > 0 && (
            <div className="flex items-center gap-1">
              {(['all', 'open', 'done'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded transition-colors ${
                    filter === f ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f === 'all' ? `All (${pad.notes.length})` : f === 'open' ? `Open (${openCount})` : `Done (${doneCount})`}
                </button>
              ))}
            </div>
          )}

          {/* Notes list */}
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {filteredNotes.length === 0 && (
              <div className="text-[10px] font-mono text-muted-foreground/50 italic py-4 text-center">
                {pad.notes.length === 0 ? 'No actions or notes yet. Add your first one above.' : 'No items match this filter.'}
              </div>
            )}
            {filteredNotes.map(note => {
              const cat = CATEGORIES.find(c => c.value === note.category)!;
              const age = Math.floor((Date.now() - new Date(note.createdAt).getTime()) / (1000 * 60));
              const ageStr = age < 60 ? `${age}m ago` : age < 1440 ? `${Math.floor(age / 60)}h ago` : `${Math.floor(age / 1440)}d ago`;

              return (
                <div
                  key={note.id}
                  className={`flex items-start gap-2 p-2 rounded-lg transition-colors hover:bg-muted/10 ${
                    note.completed ? 'opacity-50' : ''
                  }`}
                >
                  <button onClick={() => toggleComplete(note.id)} className="mt-0.5 flex-shrink-0">
                    {note.completed
                      ? <CheckSquare className="w-3.5 h-3.5 text-grade-a" />
                      : <Square className="w-3.5 h-3.5 text-muted-foreground/40 hover:text-primary" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${cat.color}`}>
                        {cat.label}
                      </span>
                      <span className={`text-xs ${note.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {note.text}
                      </span>
                    </div>
                    <div className="text-[9px] text-muted-foreground/50 mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {ageStr}
                    </div>
                  </div>
                  <button
                    onClick={() => removeNote(note.id)}
                    className="flex-shrink-0 text-muted-foreground/30 hover:text-grade-f transition-colors mt-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
