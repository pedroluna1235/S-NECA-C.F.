import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yuokfbisddnevfwazezf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1b2tmYmlzZGRuZXZmd2F6ZXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NTM0MDUsImV4cCI6MjA5OTMyOTQwNX0.L3GSN4Y9OQ56pnPB0rr-j-Dny5R0QEUSBSkTOIVcdMg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data: partido } = await supabase.from('partidos').select('id').limit(1).single();
  if (!partido) return console.log('No partido found');
  
  const payload = {
    partido_id: partido.id,
    salida_balon: ['En corto']
  };
  const { data, error } = await supabase.from('informe_rival').insert([payload]).select();
  console.log('Insert data:', data);
  if (error) console.log('Insert error:', error);
}

test();
