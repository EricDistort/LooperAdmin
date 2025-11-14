// supabaseClient.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { fetch } from 'cross-fetch';

const SUPABASE_URL = 'https://cteblkcxyvrlesukbtrf.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0ZWJsa2N4eXZybGVzdWtidHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTI4NjYsImV4cCI6MjA3ODQyODg2Nn0.f05hJjShHnaLnfSdAz-OlnUPD3eLX7vb1C27GuN-8lw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch },
});