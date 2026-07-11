import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yuokfbisddnevfwazezf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1b2tmYmlzZGRuZXZmd2F6ZXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NTM0MDUsImV4cCI6MjA5OTMyOTQwNX0.L3GSN4Y9OQ56pnPB0rr-j-Dny5R0QEUSBSkTOIVcdMg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  // Try to use rpc to execute SQL if there's a function, but we can't easily execute raw SQL from the anon client.
  console.log('Cannot execute DDL (ALTER TABLE) via anon key.');
}

test();
