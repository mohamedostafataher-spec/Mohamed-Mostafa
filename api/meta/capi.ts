export interface VercelRequest {
  method?: string;
  body?: any;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}

export interface VercelResponse {
  setHeader(name: string, value: string): void;
  status(statusCode: number): VercelResponse;
  json(body: any): void;
  end(): void;
}
import crypto from 'crypto';

const DEFAULT_META_PIXEL_ID = '1648674350574190';
// Read from environment variable first, with fallback to configured token
const DEFAULT_META_CAPI_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || 'EABD8o49XjZBMBSx1kZCB94D9h5hYDZB4rTMd7Fq8byLh0U2AvjYZAutqsrIHDghcrnkOVvQ7LdtD6p4d45ZCNx4KCNU5ZCXyRQJA2rQoLjiqfRgtY7TqjLZCulfVa4jOZAKZAPHHhijFcVcunEPB9UwWFOsnbQQIiTj2D5gBwA8BZBZBZCHZAaopoi0wcIZA2fx6ZBRau6uBwZDZD';

function hashSha256(val: string): string {
  if (!val) return '';
  return crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex');
}

function normalizePhone(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/[^\d+]/g, '');
  if (clean.startsWith('05')) {
    clean = '966' + clean.substring(1);
  } else if (clean.startsWith('+')) {
    clean = clean.substring(1);
  }
  return clean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      event_name,
      event_id,
      event_source_url,
      user_data = {},
      custom_data = {},
      test_event_code,
      pixel_id,
      access_token
    } = req.body || {};

    if (!event_name) {
      return res.status(400).json({ error: 'Missing required event_name' });
    }

    const activePixelId = (pixel_id || DEFAULT_META_PIXEL_ID).trim();
    const activeToken = (access_token || process.env.META_CAPI_ACCESS_TOKEN || DEFAULT_META_CAPI_TOKEN).trim();

    // Extract client IP and user agent
    const rawIp = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1';
    const clientIp = rawIp.split(',')[0].trim();
    const userAgent = (req.headers['user-agent'] as string) || user_data.client_user_agent || '';

    // Extract Meta cookies
    const cookies = String(req.headers.cookie || '');
    const fbp = cookies.match(/_fbp=([^;]+)/)?.[1];
    const fbc = cookies.match(/_fbc=([^;]+)/)?.[1];

    const formattedUserData: Record<string, any> = {
      client_ip_address: clientIp,
      client_user_agent: userAgent
    };

    if (fbp) formattedUserData.fbp = fbp;
    if (fbc) formattedUserData.fbc = fbc;

    if (user_data.email) {
      formattedUserData.em = [hashSha256(user_data.email)];
    }
    if (user_data.phone) {
      formattedUserData.ph = [hashSha256(normalizePhone(user_data.phone))];
    }
    if (user_data.city) {
      formattedUserData.ct = [hashSha256(user_data.city)];
    }
    if (user_data.country) {
      formattedUserData.country = [hashSha256(user_data.country.toLowerCase())];
    }

    const eventItem: Record<string, any> = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: event_source_url || 'https://sulta.vercel.app/',
      user_data: formattedUserData
    };

    if (event_id) {
      eventItem.event_id = event_id; // For deduplication with browser pixel
    }

    if (custom_data && Object.keys(custom_data).length > 0) {
      eventItem.custom_data = custom_data;
    }

    const metaPayload: Record<string, any> = {
      data: [eventItem]
    };

    const effectiveTestCode = test_event_code || process.env.META_TEST_EVENT_CODE;
    if (effectiveTestCode) {
      metaPayload.test_event_code = effectiveTestCode;
    }

    const metaUrl = `https://graph.facebook.com/v19.0/${activePixelId}/events?access_token=${activeToken}`;

    const metaRes = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metaPayload)
    });

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      return res.status(metaRes.status).json({
        success: false,
        error: 'Meta Graph API Error',
        details: metaData
      });
    }

    return res.status(200).json({
      success: true,
      events_received: metaData.events_received || 1,
      fbtrace_id: metaData.fbtrace_id,
      deduplicated_event_id: event_id
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error processing CAPI request'
    });
  }
}
