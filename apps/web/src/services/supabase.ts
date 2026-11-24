import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://ufxlojhllrvbtcrgfxsn.supabase.co';
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  'sb_publishable_Qzyj0IDA7UArvDOIooaJgw_p-EQDDdv';

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
