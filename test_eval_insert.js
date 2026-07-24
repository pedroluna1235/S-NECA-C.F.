import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yuokfbisddnevfwazezf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1b2tmYmlzZGRuZXZmd2F6ZXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NTM0MDUsImV4cCI6MjA5OTMyOTQwNX0.L3GSN4Y9OQ56pnPB0rr-j-Dny5R0QEUSBSkTOIVcdMg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const cleanData = [
    {
      partido_id: '1687aa95-b144-445c-9577-44b223c0151f', // Match from screenshot
      jugador_id: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789', // Dummy uuid, will probably fail FK but let's see
      minutos_jugados: 35,
      goles: 0,
      nota: 7
    }
  ];

  const { data, error } = await supabase
    .from('evaluaciones_partido')
    .upsert(cleanData, { onConflict: 'partido_id,jugador_id' });

  console.log('Result:', data);
  if (error) {
    console.log('Full Error:', JSON.stringify(error, null, 2));
  }
}

testInsert();
