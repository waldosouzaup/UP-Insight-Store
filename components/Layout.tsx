import React, { ReactNode } from 'react';
import { LayoutDashboard, MessageSquareText, PackageSearch, Store, Menu, X, LogOut, Upload, Settings } from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  children: ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onLogout: () => void;
  onUploadNew: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, onLogout, onUploadNew }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        setView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 mb-2 rounded-lg transition-all duration-200 ${
        currentView === view
          ? 'bg-[#49FFBD] text-[#002D39] shadow-[0_0_15px_rgba(73,255,189,0.3)] font-bold'
          : 'text-slate-300 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#002D39' }}>
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 h-full border-r border-white/10" style={{ backgroundColor: '#00232d' }}>
        <div className="flex items-center px-6 py-8 border-b border-white/10">
          <div className="p-2 rounded-lg mr-3" style={{ backgroundColor: '#49FFBD' }}>
            <Store className="w-6 h-6" style={{ color: '#002D39' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">UP InsightStore</h1>
            <p className="text-xs text-white/50">Retail Intelligence</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6">
          <NavItem view={ViewState.DASHBOARD} icon={LayoutDashboard} label="Dashboard Geral" />
          <NavItem view={ViewState.INSIGHTS} icon={MessageSquareText} label="Analista IA" />
          <NavItem view={ViewState.INVENTORY} icon={PackageSearch} label="Estoque & Alertas" />
          
          <div className="mt-8 pt-8 border-t border-white/10">
             <NavItem view={ViewState.SETTINGS} icon={Settings} label="Configurações" />
             <button
               onClick={onUploadNew}
               className="flex items-center w-full px-4 py-3 mb-2 text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
             >
                <Upload className="w-5 h-5 mr-3" />
                <span className="font-medium">Novo Upload</span>
             </button>
          </div>
        </nav>

        <div className="p-4 border-t border-white/10">
            <button 
                onClick={onLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
                <LogOut className="w-4 h-4 mr-3" />
                Sair do sistema
            </button>
            <div className="mt-4 text-xs text-slate-500 text-center">
                v1.3.0 • Powered by Gemini
            </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full z-50 px-4 py-3 flex items-center justify-between shadow-md border-b border-white/10" style={{ backgroundColor: '#00232d' }}>
         <div className="flex items-center">
            <Store className="w-6 h-6 mr-2" style={{ color: '#49FFBD' }} />
            <span className="font-bold text-white">UP InsightStore</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
           {isMobileMenuOpen ? <X /> : <Menu />}
         </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 pt-20 px-6 md:hidden" style={{ backgroundColor: '#002D39' }}>
          <nav>
            <NavItem view={ViewState.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
            <NavItem view={ViewState.INSIGHTS} icon={MessageSquareText} label="Analista IA" />
            <NavItem view={ViewState.INVENTORY} icon={PackageSearch} label="Estoque" />
            <div className="border-t border-white/10 mt-4 pt-4">
                 <NavItem view={ViewState.SETTINGS} icon={Settings} label="Configurações" />
                 <button onClick={onUploadNew} className="flex items-center w-full py-3 text-slate-300">
                    <Upload className="w-5 h-5 mr-3" /> Novo Upload
                 </button>
                 <button onClick={onLogout} className="flex items-center w-full py-3 text-red-400">
                    <LogOut className="w-5 h-5 mr-3" /> Sair
                 </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-full pt-16 md:pt-0 scrollbar-hide">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;