import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
// Anon key memang publik; keamanan dijaga oleh RLS (lihat schema.sql). JANGAN pakai service_role key.
export const SUPABASE_URL = 'https://qurbudsymalsjefffbgs.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_oHrurBEDkB4g6jW84_pGfg_39Yk_EQN';
export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const $ = (s, r = document) => r.querySelector(s);
export const rp = n => 'Rp' + Number(n || 0).toLocaleString('id-ID');
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const wa = (num, text) => `https://wa.me/${String(num).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
export const fmtDate = d => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
