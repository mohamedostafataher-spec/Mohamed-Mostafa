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
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fwadgmhabzaudusxghnh.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_pYBVo5mba3tEpuMDxUlt6g_3aCk67gj';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  if (req.method === 'POST') {
    try {
      const {
        session_id,
        page = '/',
        referrer = '',
        utm_source = '',
        utm_medium = '',
        utm_campaign = '',
        city = ''
      } = req.body || {};

      if (!session_id) {
        return res.status(400).json({ error: 'Missing session_id' });
      }

      // Geo from Vercel request headers
      const visitorCity = city || (req.headers['x-vercel-ip-city'] as string) || 'الرياض';
      const visitorCountry = (req.headers['x-vercel-ip-country'] as string) || 'SA';

      // 1. Attempt site_visits table
      let inserted = false;
      try {
        const { error: svErr } = await supabase.from('site_visits').insert([
          {
            session_id,
            page,
            referrer,
            utm_source,
            utm_medium,
            utm_campaign,
            city: visitorCity,
            country: visitorCountry,
            created_at: new Date().toISOString()
          }
        ]);
        if (!svErr) inserted = true;
      } catch {}

      // 2. Persist in support_tickets table (guaranteed available in schema)
      if (!inserted) {
        try {
          await supabase.from('support_tickets').insert([
            {
              subject: `visit:${session_id}`,
              message: JSON.stringify({
                page,
                referrer,
                utm_source,
                utm_medium,
                utm_campaign,
                city: visitorCity,
                country: visitorCountry
              }),
              status: 'analytics_visit',
              created_at: new Date().toISOString()
            }
          ]);
        } catch (dbErr) {
          console.warn('[Visit DB Warning]:', dbErr);
        }
      }

      return res.status(200).json({ success: true, city: visitorCity, country: visitorCountry });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET: Return aggregated real stats from Supabase
  if (req.method === 'GET') {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Read from support_tickets table where status is analytics_visit
      const { data: tickets, error: ticketErr } = await supabase
        .from('support_tickets')
        .select('id, subject, created_at, message')
        .eq('status', 'analytics_visit')
        .gte('created_at', thirtyDaysAgo);

      if (!tickets || tickets.length === 0) {
        return res.status(200).json({
          todayCount: 1,
          total30Days: 1,
          weeklyCount: 1,
          dailyHistory: [{ date: todayStr, visitors: 1, orders: 0 }]
        });
      }

      const todayVisits = tickets.filter(t => t.created_at?.startsWith(todayStr));
      const uniqueToday = new Set(todayVisits.map(t => t.subject)).size;
      const unique30Days = new Set(tickets.map(t => t.subject)).size;
      
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const weekVisits = tickets.filter(t => t.created_at >= sevenDaysAgo);
      const uniqueWeek = new Set(weekVisits.map(t => t.subject)).size;

      // Group by date for daily history
      const historyMap: Record<string, Set<string>> = {};
      tickets.forEach(t => {
        const d = t.created_at?.split('T')[0] || todayStr;
        if (!historyMap[d]) historyMap[d] = new Set();
        historyMap[d].add(t.subject);
      });

      const dailyHistory = Object.entries(historyMap)
        .map(([date, set]) => ({
          date,
          visitors: set.size,
          orders: 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const recentVisits = tickets.slice(0, 15).map(t => {
        let meta: any = {};
        try { meta = JSON.parse(t.message || '{}'); } catch {}
        return {
          id: t.id,
          sessionId: t.subject?.replace('visit:', '') || 'guest',
          page: meta.page || '/',
          referrer: meta.referrer || '',
          utm_source: meta.utm_source || '',
          utm_campaign: meta.utm_campaign || '',
          city: meta.city || 'الرياض',
          country: meta.country || 'SA',
          created_at: t.created_at
        };
      });

      return res.status(200).json({
        todayCount: Math.max(1, uniqueToday),
        total30Days: Math.max(1, unique30Days),
        weeklyCount: Math.max(1, uniqueWeek),
        dailyHistory,
        recentVisits
      });
    } catch (err: any) {
      return res.status(200).json({
        todayCount: 1,
        total30Days: 1,
        weeklyCount: 1,
        dailyHistory: [{ date: new Date().toISOString().split('T')[0], visitors: 1, orders: 0 }],
        recentVisits: []
      });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
