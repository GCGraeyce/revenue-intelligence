import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  SyncStatus,
  getSyncStatus,
  autoConnect,
  fetchDeals,
  batchWritePQS,
  writePQScore,
  createDealNote,
  createTask,
  testConnection,
  updateSyncStatus,
  ZohoDeal,
} from '@/lib/zoho-crm';
import { Deal, pipelineDeals } from '@/data/demo-data';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SyncEvent {
  id: string;
  type: 'sync' | 'write-back' | 'note' | 'task' | 'error';
  message: string;
  timestamp: Date;
  dealId?: string;
  success: boolean;
}

interface CRMContextType {
  status: SyncStatus;
  events: SyncEvent[];
  crmDeals: ZohoDeal[];
  isConnecting: boolean;
  connect: () => Promise<void>;
  syncNow: () => Promise<void>;
  writePQS: (deal: Deal) => Promise<boolean>;
  batchSync: () => Promise<{ success: number; failed: number }>;
  pushNote: (dealId: string, title: string, content: string) => Promise<string>;
  pushTask: (dealId: string, subject: string, description: string) => Promise<string>;
}

const CRMContext = createContext<CRMContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CRMProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus());
  const [events, setEvents] = useState<SyncEvent[]>([]);
  const [crmDeals, setCrmDeals] = useState<ZohoDeal[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  function addEvent(evt: Omit<SyncEvent, 'id' | 'timestamp'>) {
    setEvents((prev) =>
      [
        {
          ...evt,
          id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date(),
        },
        ...prev,
      ].slice(0, 50)
    ); // keep last 50
  }

  // Auto-connect on mount
  useEffect(() => {
    (async () => {
      setIsConnecting(true);
      const s = await autoConnect();
      setStatus(s);
      if (s.connected) {
        const { deals } = await fetchDeals(1, 200);
        setCrmDeals(deals);
        addEvent({
          type: 'sync',
          message: `Connected to Zoho CRM — ${s.recordCount} records synced`,
          success: true,
        });
      }
      setIsConnecting(false);
    })();
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const result = await testConnection();
      if (result.ok) {
        const s = await autoConnect();
        setStatus(s);
        const { deals } = await fetchDeals(1, 200);
        setCrmDeals(deals);
        addEvent({
          type: 'sync',
          message: `Reconnected — ${result.org} / ${result.user}`,
          success: true,
        });
      } else {
        addEvent({ type: 'error', message: `Connection failed: ${result.error}`, success: false });
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const syncNow = useCallback(async () => {
    updateSyncStatus({ syncInProgress: true });
    setStatus(getSyncStatus());
    try {
      const { deals } = await fetchDeals(1, 200);
      setCrmDeals(deals);
      updateSyncStatus({
        lastSync: new Date(),
        syncInProgress: false,
        recordCount: pipelineDeals.length,
      });
      setStatus(getSyncStatus());
      addEvent({
        type: 'sync',
        message: `Full sync complete — ${deals.length} deals refreshed`,
        success: true,
      });
    } catch (err) {
      updateSyncStatus({ syncInProgress: false, error: String(err) });
      setStatus(getSyncStatus());
      addEvent({ type: 'error', message: `Sync failed: ${err}`, success: false });
    }
  }, []);

  const writePQS = useCallback(async (deal: Deal): Promise<boolean> => {
    try {
      const ok = await writePQScore(deal.id, deal.pqScore, deal.grade);
      addEvent({
        type: 'write-back',
        message: `PQS ${deal.pqScore} (${deal.grade}) → ${deal.company}`,
        dealId: deal.id,
        success: ok,
      });
      return ok;
    } catch (err) {
      addEvent({
        type: 'error',
        message: `PQS write failed: ${deal.company} — ${err}`,
        dealId: deal.id,
        success: false,
      });
      return false;
    }
  }, []);

  const batchSync = useCallback(async () => {
    addEvent({
      type: 'sync',
      message: `Batch PQS write started — ${pipelineDeals.length} deals`,
      success: true,
    });
    const result = await batchWritePQS(pipelineDeals);
    addEvent({
      type: 'write-back',
      message: `Batch complete: ${result.success} written, ${result.failed} failed`,
      success: result.failed === 0,
    });
    return result;
  }, []);

  const pushNote = useCallback(async (dealId: string, title: string, content: string) => {
    try {
      const noteId = await createDealNote(dealId, title, content);
      const deal = pipelineDeals.find((d) => d.id === dealId);
      addEvent({
        type: 'note',
        message: `Note "${title}" → ${deal?.company || dealId}`,
        dealId,
        success: true,
      });
      return noteId;
    } catch (err) {
      addEvent({ type: 'error', message: `Note creation failed: ${err}`, dealId, success: false });
      return '';
    }
  }, []);

  const pushTask = useCallback(async (dealId: string, subject: string, description: string) => {
    try {
      const dueDate = new Date(Date.now() + 7 * 86400_000).toISOString().split('T')[0];
      const taskId = await createTask(dealId, subject, description, dueDate);
      const deal = pipelineDeals.find((d) => d.id === dealId);
      addEvent({
        type: 'task',
        message: `Task "${subject}" → ${deal?.company || dealId}`,
        dealId,
        success: true,
      });
      return taskId;
    } catch (err) {
      addEvent({ type: 'error', message: `Task creation failed: ${err}`, dealId, success: false });
      return '';
    }
  }, []);

  const value = useMemo(
    () => ({
      status,
      events,
      crmDeals,
      isConnecting,
      connect,
      syncNow,
      writePQS,
      batchSync,
      pushNote,
      pushTask,
    }),
    [
      status,
      events,
      crmDeals,
      isConnecting,
      connect,
      syncNow,
      writePQS,
      batchSync,
      pushNote,
      pushTask,
    ]
  );

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
}

export function useCRM() {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used within CRMProvider');
  return ctx;
}
