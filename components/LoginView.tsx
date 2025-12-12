import React, { useState } from 'react';
import { Store, ArrowRight, Lock, Mail, User, Phone } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LoginViewProps {
  onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Simple phone mask helper
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 9) {
      value = `${value.slice(0, 9)}-${value.slice(9)}`;
    }
    setPhone(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    // Validation Logic
    if (!email || !password) {
      setError('Email e senha são obrigatórios.');
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        // --- SIGN UP ---
        if (!name || !phone) {
          setError('Por favor, preencha nome e telefone para se cadastrar.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              phone: phone,
            },
          },
        });

        if (error) throw error;

        setSuccessMsg('Cadastro realizado com sucesso! Você já pode entrar.');
        setIsRegistering(false); // Switch to login mode
        setPassword(''); 

      } else {
        // --- LOGIN ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        onLogin();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#002D39' }}>
      <div className="mb-8 text-center">
        <div 
          className="inline-flex items-center justify-center p-3 rounded-xl mb-4 shadow-lg shadow-[#49FFBD]/20"
          style={{ backgroundColor: '#49FFBD' }}
        >
          <Store className="w-8 h-8" style={{ color: '#002D39' }} />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">UP InsightStore</h1>
        <p className="mt-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Inteligência para Varejo Físico</p>
      </div>

      <div className="w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden backdrop-blur-sm transition-all duration-300"
           style={{ 
             backgroundColor: 'rgba(255, 255, 255, 0.05)', 
             borderColor: 'rgba(73, 255, 189, 0.1)' 
           }}>
        <div className="p-8">
          <h2 className="text-xl font-semibold text-white mb-6">
            {isRegistering ? 'Crie sua conta' : 'Acesse sua conta'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Registration Fields */}
            {isRegistering && (
              <>
                <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                  <label className="block text-sm font-medium mb-1 text-white">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5" style={{ color: '#49FFBD' }} />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 outline-none transition-all placeholder-white/30 text-white"
                      style={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        '--tw-ring-color': '#49FFBD'
                      } as React.CSSProperties}
                      placeholder="Seu nome"
                      required={isRegistering}
                    />
                  </div>
                </div>

                <div className="animate-in slide-in-from-top-2 fade-in duration-300 delay-75">
                  <label className="block text-sm font-medium mb-1 text-white">Telefone (WhatsApp)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5" style={{ color: '#49FFBD' }} />
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={handlePhoneChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 outline-none transition-all placeholder-white/30 text-white"
                      style={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        '--tw-ring-color': '#49FFBD'
                      } as React.CSSProperties}
                      placeholder="(11) 99999-9999"
                      required={isRegistering}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Common Fields */}
            <div>
              <label className="block text-sm font-medium mb-1 text-white">Email Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5" style={{ color: '#49FFBD' }} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 outline-none transition-all placeholder-white/30 text-white"
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    '--tw-ring-color': '#49FFBD'
                  } as React.CSSProperties}
                  placeholder="admin@loja.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-white">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5" style={{ color: '#49FFBD' }} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 outline-none transition-all placeholder-white/30 text-white"
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    '--tw-ring-color': '#49FFBD'
                  } as React.CSSProperties}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-200 bg-red-900/50 p-3 rounded-lg border border-red-800 animate-in fade-in">
                {error}
              </div>
            )}

             {successMsg && (
              <div className="text-sm text-green-200 bg-green-900/50 p-3 rounded-lg border border-green-800 animate-in fade-in">
                {successMsg}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full font-bold py-2.5 rounded-lg transition-all flex items-center justify-center shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-6"
              style={{ 
                backgroundColor: '#49FFBD', 
                color: '#002D39',
                boxShadow: '0 4px 14px 0 rgba(73, 255, 189, 0.3)'
              }}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-[#002D39]/30 border-t-[#002D39] rounded-full animate-spin"></span>
              ) : (
                <>
                  {isRegistering ? 'Cadastrar e Entrar' : 'Entrar'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Footer Toggle */}
        <div className="px-8 py-4 border-t text-center"
             style={{ 
               backgroundColor: 'rgba(0, 0, 0, 0.3)', 
               borderColor: 'rgba(255, 255, 255, 0.05)' 
             }}>
          <button 
            onClick={toggleMode}
            className="text-sm hover:underline focus:outline-none transition-colors"
            style={{ color: '#49FFBD' }}
          >
            {isRegistering 
              ? 'Já possui uma conta? Faça Login' 
              : 'Não tem conta? Cadastre-se agora'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;