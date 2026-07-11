import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yuokfbisddnevfwazezf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1b2tmYmlzZGRuZXZmd2F6ZXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NTM0MDUsImV4cCI6MjA5OTMyOTQwNX0.L3GSN4Y9OQ56pnPB0rr-j-Dny5R0QEUSBSkTOIVcdMg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data: partido } = await supabase.from('partidos').select('id').limit(1).single();
  
  console.log('Testing Select:');
  const { data, error } = await supabase.from('convocatoria').select('*').limit(1);
  console.log('Select Error:', error);
  console.log('Select Data:', data);

  if (partido) {
    console.log('\nTesting Insert:');
    const { data: insertData, error: insertError } = await supabase.from('convocatoria').insert([{
      partido_id: partido.id,
      hora_partido: "12:30",
      hora_citacion: "11:30"
    }]).select();
    console.log('Insert Error:', insertError);
    console.log('Insert Data:', insertData);
  }
}

test();
