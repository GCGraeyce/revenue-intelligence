/**
 * Zoho CRM API Client
 *
 * Handles OAuth2 token exchange, deal/contact/note CRUD,
 * PQS write-back to custom fields, and bi-directional sync.
 *
 * In demo mode (no ZOHO_CLIENT_ID env), falls back to local demo-data
 * with simulated latency so the UI behaves identically.
 */

import { Deal, pipelineDeals } from '@/data/demo-data';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface ZohoConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  apiDomain: string;
}

const DEFAULT_CONFIG: ZohoConfig = {
  clientId: import.meta.env.VITE_ZOHO_CLIENT_ID || '',
  clientSecret: import.meta.env.VITE_ZOHO_CLIENT_SECRET || '',
  redirectUri: import.meta.env.VITE_ZOHO_REDIRECT_URI || `${window.location.origin}/api/zoho/callback`,
  scope: 'ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.READ',
  apiDomain: 'https://www.zohoapis.eu',
};

// ---------------------------------------------------------------------------
// Token Management
// ---------------------------------------------------------------------------

interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

let tokenSet: TokenSet | null = null;

function isLive(): boolean {
  return !!DEFAULT_CONFIG.clientId;
}

function getStoredTokens(): TokenSet | null {
  try {
    const raw = localStorage.getItem('revos_zoho_tokens');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function storeTokens(tokens: TokenSet) {
  tokenSet = tokens;
  localStorage.setItem('revos_zoho_tokens', JSON.stringify(tokens));
}

function clearTokens() {
  tokenSet = null;
  localStorage.removeItem('revos_zoho_tokens');
}

// ---------------------------------------------------------------------------
// OAuth2 Flow
// ---------------------------------------------------------------------------

export function getAuthUrl(): string {
  const params = new URLSearchParams({
    scope: DEFAULT_CONFIG.scope,
    client_id: DEFAULT_CONFIG.clientId,
    response_type: 'code',
    access_type: 'offline',
    redirect_uri: DEFAULT_CONFIG.redirectUri,
    prompt: 'consent',
  });
  return `https://accounts.zoho.eu/oauth/v2/auth?${params}`;
}

export async function exchangeCode(code: string): Promise<TokenSet> {
  if (!isLive()) return simulateTokenExchange();

  const res = await fetch('https://accounts.zoho.eu/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: DEFAULT_CONFIG.clientId,
      client_secret: DEFAULT_CONFIG.clientSecret,
      redirect_uri: DEFAULT_CONFIG.redirectUri,
      code,
    }),
  });
  const data = await res.json();
  const tokens: TokenSet = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  storeTokens(tokens);
  return tokens;
}

async function refreshAccessToken(): Promise<string> {
  const stored = tokenSet || getStoredTokens();
  if (!stored) throw new Error('No refresh token available');

  if (stored.expiresAt > Date.now() + 60_000) return stored.accessToken;

  const res = await fetch('https://accounts.zoho.eu/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: DEFAULT_CONFIG.clientId,
      client_secret: DEFAULT_CONFIG.clientSecret,
      refresh_token: stored.refreshToken,
    }),
  });
  const data = await res.json();
  const updated: TokenSet = {
    ...stored,
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  storeTokens(updated);
  return updated.accessToken;
}

// ---------------------------------------------------------------------------
// API Helpers
// ---------------------------------------------------------------------------

async function zohoFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await refreshAccessToken();
  const res = await fetch(`${DEFAULT_CONFIG.apiDomain}/crm/v5${path}`, {
    ...options,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`Zoho API ${res.status}: ${await res.text()}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Deal Operations
// ---------------------------------------------------------------------------

export interface ZohoDeal {
  id: string;
  Deal_Name: string;
  Account_Name: { name: string; id: string };
  Owner: { name: string; id: string };
  Amount: number;
  Stage: string;
  Closing_Date: string;
  Pipeline_Quality_Score?: number;
  PQ_Grade?: string;
  Forecast_Category?: string;
  Created_Time: string;
  Modified_Time: string;
}

export interface ZohoContact {
  id: string;
  Full_Name: string;
  Email: string;
  Title: string;
  Account_Name: { name: string; id: string };
  Owner: { name: string; id: string };
}

export interface ZohoNote {
  id: string;
  Note_Title: string;
  Note_Content: string;
  Parent_Id: { module: string; id: string };
  Created_Time: string;
  Owner: { name: string; id: string };
}

// Fetch all deals with pagination
export async function fetchDeals(page = 1, perPage = 200): Promise<{ deals: ZohoDeal[]; hasMore: boolean }> {
  if (!isLive()) return simulateFetchDeals(page, perPage);

  const data = await zohoFetch<{ data: ZohoDeal[]; info: { more_records: boolean } }>(
    `/Deals?page=${page}&per_page=${perPage}&sort_by=Modified_Time&sort_order=desc`
  );
  return { deals: data.data || [], hasMore: data.info?.more_records || false };
}

// Fetch contacts for a deal's account
export async function fetchContactsByAccount(accountId: string): Promise<ZohoContact[]> {
  if (!isLive()) return simulateFetchContacts(accountId);

  const data = await zohoFetch<{ data: ZohoContact[] }>(
    `/Contacts/search?criteria=(Account_Name.id:equals:${accountId})`
  );
  return data.data || [];
}

// Fetch notes for a deal
export async function fetchNotesForDeal(dealId: string): Promise<ZohoNote[]> {
  if (!isLive()) return simulateFetchNotes(dealId);

  const data = await zohoFetch<{ data: ZohoNote[] }>(
    `/Deals/${dealId}/Notes?sort_by=Created_Time&sort_order=desc`
  );
  return data.data || [];
}

// Write PQS score back to CRM
export async function writePQScore(dealId: string, pqScore: number, grade: string): Promise<boolean> {
  if (!isLive()) return simulateWritePQS(dealId, pqScore, grade);

  await zohoFetch(`/Deals`, {
    method: 'PUT',
    body: JSON.stringify({
      data: [{
        id: dealId,
        Pipeline_Quality_Score: pqScore,
        PQ_Grade: grade,
      }],
    }),
  });
  return true;
}

// Write forecast category back to CRM
export async function writeForecastCategory(dealId: string, category: string): Promise<boolean> {
  if (!isLive()) return simulateWriteField(dealId, 'Forecast_Category', category);

  await zohoFetch(`/Deals`, {
    method: 'PUT',
    body: JSON.stringify({
      data: [{ id: dealId, Forecast_Category: category }],
    }),
  });
  return true;
}

// Create a note on a deal (for coaching actions / AI write-back)
export async function createDealNote(dealId: string, title: string, content: string): Promise<string> {
  if (!isLive()) return simulateCreateNote(dealId, title, content);

  const data = await zohoFetch<{ data: { details: { id: string } }[] }>(
    `/Deals/${dealId}/Notes`,
    {
      method: 'POST',
      body: JSON.stringify({
        data: [{ Note_Title: title, Note_Content: content }],
      }),
    }
  );
  return data.data[0]?.details?.id || '';
}

// Create a task on a deal (for webhook automation)
export async function createTask(dealId: string, subject: string, description: string, dueDate: string, assignedTo?: string): Promise<string> {
  if (!isLive()) return simulateCreateTask(dealId, subject, description);

  const data = await zohoFetch<{ data: { details: { id: string } }[] }>(
    `/Tasks`,
    {
      method: 'POST',
      body: JSON.stringify({
        data: [{
          Subject: subject,
          Description: description,
          Due_Date: dueDate,
          What_Id: { module: 'Deals', id: dealId },
          ...(assignedTo ? { Owner: assignedTo } : {}),
        }],
      }),
    }
  );
  return data.data[0]?.details?.id || '';
}

// Batch write PQS for all deals
export async function batchWritePQS(deals: Deal[]): Promise<{ success: number; failed: number }> {
  if (!isLive()) return simulateBatchPQS(deals);

  let success = 0;
  let failed = 0;
  // Zoho allows 100 records per batch
  for (let i = 0; i < deals.length; i += 100) {
    const batch = deals.slice(i, i + 100);
    try {
      await zohoFetch('/Deals', {
        method: 'PUT',
        body: JSON.stringify({
          data: batch.map(d => ({
            id: d.id,
            Pipeline_Quality_Score: d.pqScore,
            PQ_Grade: d.grade,
            Forecast_Category: d.forecastCategory,
          })),
        }),
      });
      success += batch.length;
    } catch {
      failed += batch.length;
    }
  }
  return { success, failed };
}

// ---------------------------------------------------------------------------
// Connection Test
// ---------------------------------------------------------------------------

export async function testConnection(): Promise<{ ok: boolean; org?: string; user?: string; error?: string }> {
  if (!isLive()) return simulateTestConnection();

  try {
    const data = await zohoFetch<{ users: { full_name: string; profile: { name: string } }[] }>(
      '/users?type=CurrentUser'
    );
    const user = data.users?.[0];
    return { ok: true, user: user?.full_name, org: user?.profile?.name };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// Sync Status
// ---------------------------------------------------------------------------

export interface SyncStatus {
  connected: boolean;
  mode: 'live' | 'demo';
  lastSync: Date | null;
  recordCount: number;
  syncInProgress: boolean;
  error: string | null;
}

let syncStatus: SyncStatus = {
  connected: false,
  mode: isLive() ? 'live' : 'demo',
  lastSync: null,
  recordCount: 0,
  syncInProgress: false,
  error: null,
};

export function getSyncStatus(): SyncStatus {
  return { ...syncStatus };
}

export function updateSyncStatus(update: Partial<SyncStatus>) {
  syncStatus = { ...syncStatus, ...update };
}

// ---------------------------------------------------------------------------
// Demo Mode Simulators (realistic latency + data)
// ---------------------------------------------------------------------------

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateTokenExchange(): Promise<TokenSet> {
  await delay(800);
  const tokens: TokenSet = {
    accessToken: 'demo_access_' + Date.now(),
    refreshToken: 'demo_refresh_' + Date.now(),
    expiresAt: Date.now() + 3600_000,
  };
  storeTokens(tokens);
  return tokens;
}

async function simulateFetchDeals(page: number, perPage: number): Promise<{ deals: ZohoDeal[]; hasMore: boolean }> {
  await delay(300 + Math.random() * 400);
  const start = (page - 1) * perPage;
  const slice = pipelineDeals.slice(start, start + perPage);
  return {
    deals: slice.map(d => ({
      id: d.id,
      Deal_Name: `${d.company} - ${d.productBundle}`,
      Account_Name: { name: d.company, id: `acc_${d.id}` },
      Owner: { name: d.rep, id: `rep_${d.rep.replace(/\s/g, '_').toLowerCase()}` },
      Amount: d.acv,
      Stage: d.stage,
      Closing_Date: d.closeDate,
      Pipeline_Quality_Score: d.pqScore,
      PQ_Grade: d.grade,
      Forecast_Category: d.forecastCategory,
      Created_Time: d.createdDate,
      Modified_Time: new Date().toISOString(),
    })),
    hasMore: start + perPage < pipelineDeals.length,
  };
}

async function simulateFetchContacts(accountId: string): Promise<ZohoContact[]> {
  await delay(200 + Math.random() * 300);
  const personas = ['Project Manager', 'Safety Officer', 'CFO', 'IT Director', 'CEO'];
  return personas.slice(0, 2 + Math.floor(Math.random() * 3)).map((title, i) => ({
    id: `contact_${accountId}_${i}`,
    Full_Name: `Contact ${i + 1}`,
    Email: `contact${i + 1}@example.com`,
    Title: title,
    Account_Name: { name: 'Account', id: accountId },
    Owner: { name: 'Conor Murphy', id: 'rep_conor' },
  }));
}

async function simulateFetchNotes(dealId: string): Promise<ZohoNote[]> {
  await delay(200 + Math.random() * 200);
  return [
    {
      id: `note_${dealId}_1`,
      Note_Title: 'Discovery Call Summary',
      Note_Content: 'Discussed project timeline and camera requirements. Budget approved Q1. Champion is enthusiastic about AI analytics.',
      Parent_Id: { module: 'Deals', id: dealId },
      Created_Time: new Date(Date.now() - 5 * 86400_000).toISOString(),
      Owner: { name: 'Conor Murphy', id: 'rep_conor' },
    },
    {
      id: `note_${dealId}_2`,
      Note_Title: 'RevOS AI: Coaching Action',
      Note_Content: 'Auto-generated: EB Recovery play initiated. Recommend scheduling executive briefing within 7 days to improve win probability by +35%.',
      Parent_Id: { module: 'Deals', id: dealId },
      Created_Time: new Date(Date.now() - 2 * 86400_000).toISOString(),
      Owner: { name: 'RevOS AI', id: 'system' },
    },
  ];
}

async function simulateWritePQS(dealId: string, pqScore: number, grade: string): Promise<boolean> {
  await delay(400 + Math.random() * 300);
  console.log(`[Demo CRM] Write PQS: Deal ${dealId} → Score ${pqScore}, Grade ${grade}`);
  return true;
}

async function simulateWriteField(dealId: string, field: string, value: string): Promise<boolean> {
  await delay(300 + Math.random() * 200);
  console.log(`[Demo CRM] Write field: Deal ${dealId} → ${field} = ${value}`);
  return true;
}

async function simulateCreateNote(dealId: string, title: string, _content: string): Promise<string> {
  await delay(500 + Math.random() * 300);
  const noteId = `note_${Date.now()}`;
  console.log(`[Demo CRM] Create note: Deal ${dealId} → "${title}" (${noteId})`);
  return noteId;
}

async function simulateCreateTask(dealId: string, subject: string, _description: string): Promise<string> {
  await delay(400 + Math.random() * 300);
  const taskId = `task_${Date.now()}`;
  console.log(`[Demo CRM] Create task: Deal ${dealId} → "${subject}" (${taskId})`);
  return taskId;
}

async function simulateBatchPQS(deals: Deal[]): Promise<{ success: number; failed: number }> {
  await delay(800 + Math.random() * 600);
  console.log(`[Demo CRM] Batch PQS write: ${deals.length} deals`);
  return { success: deals.length, failed: 0 };
}

async function simulateTestConnection(): Promise<{ ok: boolean; org?: string; user?: string }> {
  await delay(600 + Math.random() * 400);
  return { ok: true, org: 'Evercam Ltd', user: 'Gavin Daly' };
}

// ---------------------------------------------------------------------------
// Auto-connect in demo mode
// ---------------------------------------------------------------------------

export async function autoConnect(): Promise<SyncStatus> {
  updateSyncStatus({ syncInProgress: true });
  try {
    const result = await testConnection();
    if (result.ok) {
      const { deals } = await fetchDeals(1, 200);
      updateSyncStatus({
        connected: true,
        lastSync: new Date(),
        recordCount: deals.length > 0 ? pipelineDeals.length : 0,
        syncInProgress: false,
        error: null,
      });
    } else {
      updateSyncStatus({ connected: false, syncInProgress: false, error: result.error || 'Connection failed' });
    }
  } catch (err) {
    updateSyncStatus({ connected: false, syncInProgress: false, error: String(err) });
  }
  return getSyncStatus();
}

export { isLive, clearTokens };
