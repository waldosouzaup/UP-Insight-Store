import { createClient } from '@supabase/supabase-js';

// Em produção (Vite), usamos import.meta.env.
// As chaves DEVEM ser configuradas no painel de variáveis de ambiente do servidor de hospedagem (Vercel, Netlify, etc).

const SUPABASE_URL = (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 'placeholder';

if (SUPABASE_URL === 'https://placeholder.supabase.co') {
  console.warn(
    "⚠️ ATENÇÃO: As variáveis de ambiente do Supabase não foram encontradas. \n" +
    "O aplicativo está rodando em modo de fallback para evitar falhas de inicialização. Autenticação e dados reais não funcionarão."
  );
}

export const supabase = createClient(
  SUPABASE_URL, 
  SUPABASE_ANON_KEY, 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);