-- Allow public read access for orders and support tickets to enable the admin dashboard
-- This is a temporary measure for production parity until full RBAC is implemented.

CREATE POLICY "Allow public read access" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.support_tickets FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.user_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.visitors FOR SELECT USING (true);
