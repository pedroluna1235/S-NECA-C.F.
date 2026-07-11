import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yuokfbisddnevfwazezf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1b2tmYmlzZGRuZXZmd2F6ZXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NTM0MDUsImV4cCI6MjA5OTMyOTQwNX0.L3GSN4Y9OQ56pnPB0rr-j-Dny5R0QEUSBSkTOIVcdMg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.rpc('get_schema');
  console.log('RPC?', error);
  // fallback if rpc is not defined
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`);
  const json = await res.json();
  console.log(JSON.stringify(json.definitions.informe_rival, null, 2));
}

test();
