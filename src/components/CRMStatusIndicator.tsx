import { useCRM } from '@/contexts/CRMContext';
import { RefreshCw, Database, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function CRMStatusIndicator() {
  const { status, syncNow, events, isConnecting } = useCRM();
  const [showEvents, setShowEvents] = useState(false);

  const recentEvents = events.slice(0, 8);
  const lastSyncText = status.lastSync
    ? `${Math.round((Date.now() - status.lastSync.getTime()) / 60000)}m ago`
    : 'Never';

  return (
    <div className="relative">
      <button
        onClick={() => setShowEvents(!showEvents)}
        className="flex items-center gap-2 text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-border/30 hover:bg-muted/30 transition-colors"
      >
        {isConnecting || status.syncInProgress ? (
          <Loader2 className="w-3 h-3 text-primary animate-spin" />
        ) : status.connected ? (
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
        )}
        <span className="text-muted-foreground hidden md:inline">
          {status.connected ? 'Zoho CRM' : 'Demo'}
        </span>
        {status.connected && (
          <span className="text-foreground">
            {status.recordCount.toLocaleString()}
          </span>
        )}
      </button>

      {showEvents && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowEvents(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border/60 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">CRM Sync</span>
              </div>
              <button
                onClick={syncNow}
                disabled={status.syncInProgress}
                className="flex items-center gap-1 text-[10px] font-mono text-primary px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`w-3 h-3 ${status.syncInProgress ? 'animate-spin' : ''}`} />
                Sync Now
              </button>
            </div>

            {/* Status */}
            <div className="px-4 py-3 border-b border-border/20 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs font-mono font-bold text-foreground">{status.mode}</div>
                <div className="text-[9px] text-muted-foreground">Mode</div>
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-foreground">{status.recordCount.toLocaleString()}</div>
                <div className="text-[9px] text-muted-foreground">Records</div>
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-foreground">{lastSyncText}</div>
                <div className="text-[9px] text-muted-foreground">Last Sync</div>
              </div>
            </div>

            {/* Event Log */}
            <div className="max-h-48 overflow-y-auto">
              {recentEvents.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                  No sync events yet
                </div>
              ) : (
                recentEvents.map(evt => (
                  <div key={evt.id} className="flex items-center gap-2 px-4 py-2 border-b border-border/10 last:border-0">
                    {evt.success ? (
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
                    )}
                    <span className="text-[11px] text-foreground flex-1 truncate">{evt.message}</span>
                    <span className="text-[9px] font-mono text-muted-foreground flex-shrink-0">
                      {evt.timestamp.toLocaleTimeString().slice(0, 5)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
