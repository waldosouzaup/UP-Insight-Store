import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente baseadas no modo atual (development/production)
  // O terceiro parâmetro '' garante que carregue todas as variáveis, não apenas as com prefixo VITE_
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Polyfill seguro para process.env.API_KEY usado pelo SDK do Gemini
      // Garante uma string vazia caso a chave não esteja definida para evitar crash na inicialização
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  };
});