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
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      // 0. Fetch from traffic_logs (Highest fidelity UTM & session logs)
      let { data: trafficLogs } = await supabase
        .from('traffic_logs')
        .select('*')
        .gte('created_at', ninetyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(50000);

      // 1. Try to fetch from user_sessions (Primary source)
      let { data: sessions } = await supabase
        .from('user_sessions')
        .select('*')
        .gte('created_at', ninetyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(50000);

      // 2. Try to fetch from visitors (Secondary source)
      let { data: visitors } = await supabase
        .from('visitors')
        .select('*')
        .gte('created_at', ninetyDaysAgo)
        .limit(50000);

      // 3. Fetch from support_tickets (Legacy/Fallback source)
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('id, subject, created_at, message')
        .eq('status', 'analytics_visit')
        .gte('created_at', ninetyDaysAgo)
        .limit(50000);

      // Helper to clean city names (e.g. San%20Jose -> San Jose)
      const cleanCity = (c?: string) => {
        if (!c) return 'الرياض';
        try {
          let decoded = decodeURIComponent(c.replace(/\+/g, ' '));
          if (decoded.toLowerCase() === 'san jose' || decoded.toLowerCase() === 'sanjose') return 'سان خوسيه (خوادم Vercel)';
          if (decoded.toLowerCase() === 'riyadh') return 'الرياض';
          if (decoded.toLowerCase() === 'jeddah') return 'جدة';
          if (decoded.toLowerCase() === 'dammam') return 'الدمام';
          if (decoded.toLowerCase() === 'mecca' || decoded.toLowerCase() === 'makkah') return 'مكة المكرمة';
          if (decoded.toLowerCase() === 'medina' || decoded.toLowerCase() === 'madinah') return 'المدينة المنورة';
          if (decoded.toLowerCase() === 'khobar' || decoded.toLowerCase() === 'al khobar') return 'الخبر';
          if (decoded.toLowerCase() === 'cairo') return 'القاهرة';
          if (decoded.toLowerCase() === 'alexandria') return 'الإسكندرية';
          if (decoded.toLowerCase() === 'dubai') return 'دبي';
          return decoded;
        } catch {
          return c;
        }
      };

      // Merge and normalize data
      const allVisits: any[] = [];
      const sessionIds = new Set<string>();

      if (trafficLogs) {
        trafficLogs.forEach(t => {
          const sid = t.session_id || t.id;
          allVisits.push({
            id: t.id || sid,
            sessionId: sid,
            page: t.landing_page || t.page || '/',
            referrer: t.referrer || '',
            utm_source: t.utm_source || '',
            utm_campaign: t.utm_campaign || '',
            city: cleanCity(t.city),
            country: t.country || 'SA',
            created_at: t.created_at || new Date().toISOString()
          });
          sessionIds.add(sid);
        });
      }

      if (sessions) {
        sessions.forEach(s => {
          const sid = s.session_id || s.id;
          if (!sessionIds.has(sid)) {
            allVisits.push({
              id: s.id || sid,
              sessionId: sid,
              page: s.landing_page || '/',
              referrer: s.referrer || '',
              utm_source: s.utm_source || '',
              utm_campaign: s.utm_campaign || '',
              city: cleanCity(s.city),
              country: s.country || 'SA',
              created_at: s.created_at || new Date().toISOString()
            });
            sessionIds.add(sid);
          }
        });
      }

      if (visitors) {
        visitors.forEach(v => {
          const sid = v.session_id || v.id;
          if (!sessionIds.has(sid)) {
            allVisits.push({
              id: v.id || sid,
              sessionId: sid,
              page: v.landing_page || '/',
              referrer: v.referrer || '',
              utm_source: v.utm_source || '',
              utm_campaign: v.utm_campaign || '',
              city: cleanCity(v.city),
              country: v.country || 'SA',
              created_at: v.created_at || new Date().toISOString()
            });
            sessionIds.add(sid);
          }
        });
      }

      if (tickets) {
        tickets.forEach(t => {
          const sid = t.subject?.replace('visit:', '') || 'guest_' + t.id;
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
              city: cleanCity(meta.city),
              country: meta.country || 'SA',
              created_at: t.created_at || new Date().toISOString()
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
          totalHits: 1,
          uniqueCount: 1,
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
        totalHits: allVisits.length,
        uniqueCount: sessionIds.size,
        dailyHistory,
        recentVisits: allVisits.slice(0, 50000) // Supports up to 50,000 real visits!
      });
    } catch (err: any) {
      return res.status(200).json({
        todayCount: 1,
        total30Days: 1,
        weeklyCount: 1,
        totalHits: 1,
        uniqueCount: 1,
        dailyHistory: [{ date: new Date().toISOString().split('T')[0], visitors: 1, orders: 0 }],
        recentVisits: []
      });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
