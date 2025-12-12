import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Phone, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { updateUserProfile, updateUserCredentials } from '../services/supabaseService';

interface SettingsViewProps {
  onUpdateUser: (newName: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onUpdateUser }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Profile Data
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Security Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email || '');
      setName(user.user_metadata?.full_name || '');
      setPhone(user.user_metadata?.phone || '');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await updateUserProfile({ fullName: name, phone });
      onUpdateUser(name); // Update App state
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!password && !email) return;
      
      const updates: any = {};
      if (password) updates.password = password;
      
      // Note: Changing email usually requires confirmation sent to the new address
      const { data: { user } } = await supabase.auth.getUser();
      if (email !== user?.email) {
          updates.email = email;
      }

      await updateUserCredentials(updates);
      setMessage({ type: 'success', text: 'Dados de acesso atualizados! (Se alterou o e-mail, verifique sua caixa de entrada).' });
      setPassword(''); // Clear password field for security
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white">Configurações da Conta</h2>
        <p className="text-slate-400">Gerencie seus dados pessoais e de acesso.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center border ${
          message.type === 'success' 
            ? 'bg-green-500/20 border-green-500/30 text-green-300' 
            : 'bg-red-500/20 border-red-500/30 text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="p-6 rounded-xl shadow-lg border backdrop-blur-sm"
             style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <h3 className="text-lg font-semibold text-white mb-4 border-b border-white/10 pb-2">Dados Pessoais</h3>
          
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:border-[#49FFBD] focus:outline-none focus:ring-1 focus:ring-[#49FFBD]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:border-[#49FFBD] focus:outline-none focus:ring-1 focus:ring-[#49FFBD]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center justify-center w-full px-4 py-2 rounded-lg bg-[#49FFBD] text-[#002D39] font-bold hover:bg-[#3cefae] transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>

        {/* Security Card */}
        <div className="p-6 rounded-xl shadow-lg border backdrop-blur-sm"
             style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <h3 className="text-lg font-semibold text-white mb-4 border-b border-white/10 pb-2">Segurança e Acesso</h3>
          
          <form onSubmit={handleSecurityUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">E-mail de Acesso</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:border-[#49FFBD] focus:outline-none focus:ring-1 focus:ring-[#49FFBD]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Deixe em branco para manter a atual"
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white focus:border-[#49FFBD] focus:outline-none focus:ring-1 focus:ring-[#49FFBD]"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Mínimo de 6 caracteres.</p>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading || (!password && !email)}
                className="flex items-center justify-center w-full px-4 py-2 rounded-lg border border-[#49FFBD] text-[#49FFBD] font-bold hover:bg-[#49FFBD]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                Atualizar Credenciais
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;