import { createClient } from '@supabase/supabase-js';

// Helper to safely access env vars whether in Vite dev or built production
// This prevents "Cannot read properties of undefined" if import.meta.env is missing in specific environments
const getEnv = (key: string) => {
  // 1. Check process.env (injected by vite.config.ts define)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  
  // 2. Try import.meta.env (standard Vite) safely with error handling
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore errors accessing import.meta
  }
  
  return '';
};

// Recomenda-se usar variáveis de ambiente para estas chaves em produção.
// Se elas não estiverem definidas via .env, o sistema usará os valores hardcoded abaixo como fallback.

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL') || 'https://pmbzlxiizjfayrtkrcqs.supabase.co';
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYnpseGlpempmYXlydGtyY3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDA4MTEsImV4cCI6MjA4MTExNjgxMX0._iMDwnccaeVWrqeiNqYhfZhJ65FsF3HpF5-MEyVfl4Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});