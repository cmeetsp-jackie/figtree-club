const SUPABASE_URL = 'https://wtqbswlxnbvpzlsnkwhd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cWJzd2x4bmJ2cHpsc25rd2hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0OTIzNzgsImV4cCI6MjA5NzA2ODM3OH0.O3Qyt59Gdnh-eeVdWsdFsfKJI1ZLFdzIqjz70jIn0dM';

const _supa = window.supabase;
const db = _supa.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
