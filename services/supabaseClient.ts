import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pmbzlxiizjfayrtkrcqs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYnpseGlpempmYXlydGtyY3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDA4MTEsImV4cCI6MjA4MTExNjgxMX0._iMDwnccaeVWrqeiNqYhfZhJ65FsF3HpF5-MEyVfl4Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);