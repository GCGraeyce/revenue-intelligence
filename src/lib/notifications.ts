/**
 * Notification Layer — Slack webhook + email dispatcher for automation rules.
 *
 * Sends structured notifications when automation rules fire.
 * In demo mode, logs to console and stores in-memory for UI display.
 * In production, sends via Slack Incoming Webhook and/or email API.
 */

import { fmt } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotificationPayload {
  channel: 'slack' | 'email';
  recipient: string; // Slack channel (#channel) or email address
  title: string;
  body: string;
  dealId?: string;
  dealCompany?: string;
  acv?: number;
  ruleId: string;
  ruleName: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface NotificationResult {
  id: string;
  channel: 'slack' | 'email';
  success: boolean;
  timestamp: Date;
  error?: string;
}

interface NotificationConfig {
  slackWebhookUrl: string;
  emailApiUrl: string;
  emailFrom: string;
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const config: NotificationConfig = {
  slackWebhookUrl: import.meta.env.VITE_SLACK_WEBHOOK_URL || '',
  emailApiUrl: import.meta.env.VITE_EMAIL_API_URL || '',
  emailFrom: import.meta.env.VITE_EMAIL_FROM || 'revos@evercam.com',
  enabled: !!(import.meta.env.VITE_SLACK_WEBHOOK_URL || import.meta.env.VITE_EMAIL_API_URL),
};

function isLive(): boolean {
  return config.enabled;
}

// ---------------------------------------------------------------------------
// In-memory log for UI display
// ---------------------------------------------------------------------------

const notificationLog: NotificationResult[] = [];

export function getNotificationLog(): NotificationResult[] {
  return [...notificationLog];
}

export function clearNotificationLog(): void {
  notificationLog.length = 0;
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function urgencyEmoji(urgency: string): string {
  return urgency === 'critical'
    ? '🔴'
    : urgency === 'high'
      ? '🟠'
      : urgency === 'medium'
        ? '🟡'
        : '🟢';
}

function buildSlackPayload(notification: NotificationPayload): object {
  return {
    text: `${urgencyEmoji(notification.urgency)} *${notification.title}*`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${urgencyEmoji(notification.urgency)} ${notification.title}`,
        },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: notification.body },
      },
      ...(notification.dealCompany
        ? [
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Deal:* ${notification.dealCompany}` },
                {
                  type: 'mrkdwn',
                  text: `*ACV:* ${notification.acv ? fmt(notification.acv) : 'N/A'}`,
                },
                { type: 'mrkdwn', text: `*Rule:* ${notification.ruleName}` },
                { type: 'mrkdwn', text: `*Urgency:* ${notification.urgency}` },
              ],
            },
          ]
        : []),
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Sent by RevOS Revenue Intelligence · ${new Date().toISOString()}`,
          },
        ],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Senders
// ---------------------------------------------------------------------------

async function sendSlack(notification: NotificationPayload): Promise<NotificationResult> {
  const result: NotificationResult = {
    id: `notif_slack_${Date.now()}`,
    channel: 'slack',
    success: false,
    timestamp: new Date(),
  };

  if (!isLive()) {
    // Demo mode — log and succeed
    console.log(`[Demo Slack] → ${notification.recipient}: ${notification.title}`);
    console.log(`  Body: ${notification.body.slice(0, 120)}...`);
    result.success = true;
    notificationLog.unshift(result);
    return result;
  }

  try {
    const res = await fetch(config.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildSlackPayload(notification)),
    });
    result.success = res.ok;
    if (!res.ok) result.error = `Slack returned ${res.status}`;
  } catch (err) {
    result.error = String(err);
  }

  notificationLog.unshift(result);
  return result;
}

async function sendEmail(notification: NotificationPayload): Promise<NotificationResult> {
  const result: NotificationResult = {
    id: `notif_email_${Date.now()}`,
    channel: 'email',
    success: false,
    timestamp: new Date(),
  };

  if (!isLive()) {
    // Demo mode
    console.log(`[Demo Email] → ${notification.recipient}: ${notification.title}`);
    result.success = true;
    notificationLog.unshift(result);
    return result;
  }

  try {
    const res = await fetch(config.emailApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: config.emailFrom,
        to: notification.recipient,
        subject: `[RevOS] ${notification.title}`,
        html: `<h2>${notification.title}</h2><p>${notification.body}</p>${
          notification.dealCompany
            ? `<p><strong>Deal:</strong> ${notification.dealCompany} · ${notification.acv ? fmt(notification.acv) : ''}</p>`
            : ''
        }<hr/><small>Sent by RevOS Revenue Intelligence</small>`,
      }),
    });
    result.success = res.ok;
    if (!res.ok) result.error = `Email API returned ${res.status}`;
  } catch (err) {
    result.error = String(err);
  }

  notificationLog.unshift(result);
  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function sendNotification(
  notification: NotificationPayload
): Promise<NotificationResult> {
  if (notification.channel === 'slack') return sendSlack(notification);
  return sendEmail(notification);
}

export async function sendBulkNotifications(
  notifications: NotificationPayload[]
): Promise<NotificationResult[]> {
  return Promise.all(notifications.map(sendNotification));
}

/**
 * Convenience: fire notifications for an automation rule match.
 */
export function buildRuleNotifications(
  ruleId: string,
  ruleName: string,
  deals: { id: string; company: string; acv: number; pqScore: number; stage: string }[],
  urgency: NotificationPayload['urgency'] = 'medium'
): NotificationPayload[] {
  return deals.map((deal) => ({
    channel: 'slack' as const,
    recipient: '#revos-alerts',
    title: `${ruleName}: ${deal.company}`,
    body: `Deal *${deal.company}* (${fmt(deal.acv)}, PQS ${deal.pqScore}) matched rule "${ruleName}" at ${deal.stage} stage. Automated CRM action taken.`,
    dealId: deal.id,
    dealCompany: deal.company,
    acv: deal.acv,
    ruleId,
    ruleName,
    urgency,
  }));
}

export { isLive as isNotificationsLive };
