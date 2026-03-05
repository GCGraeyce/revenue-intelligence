import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchDeals, fetchContactsByAccount, fetchNotesForDeal,
  writePQScore, writeForecastCategory, createDealNote, createTask,
  batchWritePQS, testConnection, autoConnect, getSyncStatus,
  isLive, clearTokens,
} from '@/lib/zoho-crm';
import { pipelineDeals } from '@/data/demo-data';

describe('Zoho CRM Client (Demo Mode)', () => {
  beforeEach(() => {
    clearTokens();
  });

  describe('isLive', () => {
    it('returns false when no VITE_ZOHO_CLIENT_ID is set', () => {
      expect(isLive()).toBe(false);
    });
  });

  describe('fetchDeals', () => {
    it('returns deals array with correct shape', async () => {
      const { deals, hasMore } = await fetchDeals(1, 10);
      expect(Array.isArray(deals)).toBe(true);
      expect(deals.length).toBeGreaterThan(0);
      expect(deals.length).toBeLessThanOrEqual(10);
      expect(typeof hasMore).toBe('boolean');
    });

    it('returns deals with all required ZohoDeal fields', async () => {
      const { deals } = await fetchDeals(1, 5);
      const deal = deals[0];
      expect(deal.id).toBeTruthy();
      expect(deal.Deal_Name).toBeTruthy();
      expect(deal.Account_Name).toBeTruthy();
      expect(deal.Account_Name.name).toBeTruthy();
      expect(deal.Owner).toBeTruthy();
      expect(deal.Owner.name).toBeTruthy();
      expect(typeof deal.Amount).toBe('number');
      expect(deal.Stage).toBeTruthy();
      expect(deal.Closing_Date).toBeTruthy();
      expect(typeof deal.Pipeline_Quality_Score).toBe('number');
      expect(deal.PQ_Grade).toBeTruthy();
    });

    it('handles pagination', async () => {
      const page1 = await fetchDeals(1, 5);
      const page2 = await fetchDeals(2, 5);
      // Pages should return different deals (or empty)
      if (page2.deals.length > 0) {
        expect(page1.deals[0].id).not.toBe(page2.deals[0].id);
      }
    });
  });

  describe('fetchContactsByAccount', () => {
    it('returns contacts array', async () => {
      const contacts = await fetchContactsByAccount('acc_test');
      expect(Array.isArray(contacts)).toBe(true);
      expect(contacts.length).toBeGreaterThan(0);
    });

    it('returns contacts with required fields', async () => {
      const contacts = await fetchContactsByAccount('acc_test');
      const contact = contacts[0];
      expect(contact.id).toBeTruthy();
      expect(contact.Full_Name).toBeTruthy();
      expect(contact.Email).toBeTruthy();
      expect(contact.Title).toBeTruthy();
    });
  });

  describe('fetchNotesForDeal', () => {
    it('returns notes array', async () => {
      const notes = await fetchNotesForDeal('deal_123');
      expect(Array.isArray(notes)).toBe(true);
      expect(notes.length).toBe(2);
    });

    it('returns notes with required fields', async () => {
      const notes = await fetchNotesForDeal('deal_123');
      const note = notes[0];
      expect(note.id).toBeTruthy();
      expect(note.Note_Title).toBeTruthy();
      expect(note.Note_Content).toBeTruthy();
      expect(note.Parent_Id).toBeTruthy();
      expect(note.Created_Time).toBeTruthy();
    });

    it('includes RevOS AI note in simulated data', async () => {
      const notes = await fetchNotesForDeal('deal_abc');
      const aiNote = notes.find(n => n.Owner.name === 'RevOS AI');
      expect(aiNote).toBeTruthy();
    });
  });

  describe('writePQScore', () => {
    it('returns true on successful write', async () => {
      const result = await writePQScore('deal_123', 75, 'B');
      expect(result).toBe(true);
    });

    it('logs to console in demo mode', async () => {
      const spy = vi.spyOn(console, 'log');
      await writePQScore('deal_456', 42, 'C');
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('[Demo CRM] Write PQS')
      );
      spy.mockRestore();
    });
  });

  describe('writeForecastCategory', () => {
    it('returns true on successful write', async () => {
      const result = await writeForecastCategory('deal_123', 'Commit');
      expect(result).toBe(true);
    });
  });

  describe('createDealNote', () => {
    it('returns a note ID', async () => {
      const noteId = await createDealNote('deal_123', 'Test Note', 'Some content');
      expect(noteId).toBeTruthy();
      expect(noteId).toContain('note_');
    });
  });

  describe('createTask', () => {
    it('returns a task ID', async () => {
      const taskId = await createTask('deal_123', 'Follow up', 'Description', '2026-03-15');
      expect(taskId).toBeTruthy();
      expect(taskId).toContain('task_');
    });
  });

  describe('batchWritePQS', () => {
    it('returns success count matching input length', async () => {
      const subset = pipelineDeals.slice(0, 10);
      const result = await batchWritePQS(subset);
      expect(result.success).toBe(10);
      expect(result.failed).toBe(0);
    });
  });

  describe('testConnection', () => {
    it('returns ok with org info in demo mode', async () => {
      const result = await testConnection();
      expect(result.ok).toBe(true);
      expect(result.org).toBe('Evercam Ltd');
      expect(result.user).toBe('Gavin Daly');
    });
  });

  describe('autoConnect', () => {
    it('connects and updates sync status', async () => {
      const status = await autoConnect();
      expect(status.connected).toBe(true);
      expect(status.mode).toBe('demo');
      expect(status.lastSync).toBeInstanceOf(Date);
      expect(status.recordCount).toBeGreaterThan(0);
      expect(status.syncInProgress).toBe(false);
    });
  });

  describe('getSyncStatus', () => {
    it('returns default status shape', () => {
      const status = getSyncStatus();
      expect(status).toHaveProperty('connected');
      expect(status).toHaveProperty('mode');
      expect(status).toHaveProperty('lastSync');
      expect(status).toHaveProperty('recordCount');
      expect(status).toHaveProperty('syncInProgress');
      expect(status).toHaveProperty('error');
      expect(status.mode).toBe('demo');
    });
  });
});
