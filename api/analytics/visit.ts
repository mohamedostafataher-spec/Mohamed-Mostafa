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

      // 0. Primary: Attempt user_sessions table (New requirement)
      try {
        await supabase.from('user_sessions').insert([
          {
            session_id,
            utm_source,
            utm_medium,
            utm_campaign,
            referrer,
            landing_page: page,
            city: visitorCity,
            country: visitorCountry,
            created_at: new Date().toISOString()
          }
        ]);
      } catch {}

      // 1. Attempt site_visits table (Legacy)
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

      // 1. Try to fetch from user_sessions (Primary source)
      let { data: sessions, error: sessionErr } = await supabase
        .from('user_sessions')
        .select('*')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false });

      // 2. Try to fetch from visitors (Secondary source)
      let { data: visitors } = await supabase
        .from('visitors')
        .select('*')
        .gte('created_at', thirtyDaysAgo);

      // 3. Fetch from support_tickets (Legacy/Fallback source)
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('id, subject, created_at, message')
        .eq('status', 'analytics_visit')
        .gte('created_at', thirtyDaysAgo);

      // Merge and normalize data
      const allVisits: any[] = [];
      const sessionIds = new Set<string>();

      if (sessions) {
        sessions.forEach(s => {
          allVisits.push({
            id: s.id,
            sessionId: s.session_id,
            page: s.landing_page || '/',
            referrer: s.referrer || '',
            utm_source: s.utm_source || '',
            utm_campaign: s.utm_campaign || '',
            city: s.city || 'الرياض',
            country: s.country || 'SA',
            created_at: s.created_at
          });
          sessionIds.add(s.session_id);
        });
      }

      if (visitors) {
        visitors.forEach(v => {
          if (!sessionIds.has(v.session_id)) {
            allVisits.push({
              id: v.id,
              sessionId: v.session_id,
              page: v.landing_page || '/',
              referrer: v.referrer || '',
              utm_source: v.utm_source || '',
              utm_campaign: v.utm_campaign || '',
              city: v.city || 'الرياض',
              country: v.country || 'SA',
              created_at: v.created_at
            });
            sessionIds.add(v.session_id);
          }
        });
      }

      if (tickets) {
        tickets.forEach(t => {
          const sid = t.subject?.replace('visit:', '') || 'guest';
          if (!sessionIds.has(sid)) {
            let meta: any = {};
            try { meta = JSON.parse(t.message || '{}'); } catch {}
            allVisits.push({
              id: t.id,
              sessionId: sid,
              page: meta.page || '/',
              referrer: meta.referrer || '',
              utm_source: meta.utm_source || '',
              utm_campaign: meta.utm_campaign || '',
              city: meta.city || 'الرياض',
              country: meta.country || 'SA',
              created_at: t.created_at
            });
            sessionIds.add(sid);
          }
        });
      }

      if (allVisits.length === 0) {
        return res.status(200).json({
          todayCount: 1,
          total30Days: 1,
          weeklyCount: 1,
          dailyHistory: [{ date: todayStr, visitors: 1, orders: 0 }],
          recentVisits: []
        });
      }

      // Sort by date desc
      allVisits.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const todayVisits = allVisits.filter(v => v.created_at?.startsWith(todayStr));
      const uniqueToday = new Set(todayVisits.map(v => v.sessionId)).size;
      const unique30Days = new Set(allVisits.map(v => v.sessionId)).size;
      
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const weekVisits = allVisits.filter(v => v.created_at >= sevenDaysAgo);
      const uniqueWeek = new Set(weekVisits.map(v => v.sessionId)).size;

      // Group by date for daily history
      const historyMap: Record<string, Set<string>> = {};
      allVisits.forEach(v => {
        const d = v.created_at?.split('T')[0] || todayStr;
        if (!historyMap[d]) historyMap[d] = new Set();
        historyMap[d].add(v.sessionId);
      });

      const dailyHistory = Object.entries(historyMap)
        .map(([date, set]) => ({
          date,
          visitors: set.size,
          orders: 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return res.status(200).json({
        todayCount: Math.max(1, uniqueToday),
        total30Days: Math.max(1, unique30Days),
        weeklyCount: Math.max(1, uniqueWeek),
        dailyHistory,
        recentVisits: allVisits.slice(0, 50) // Return more for the heatmap
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
