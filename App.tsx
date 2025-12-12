import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import DashboardView from './components/DashboardView';
import InsightsView from './components/InsightsView';
import InventoryView from './components/InventoryView';
import LoginView from './components/LoginView';
import UploadView from './components/UploadView';
import { ViewState, StoreData } from './types';
import { supabase } from './services/supabaseClient';
import { fetchRealStoreData, signOut } from './services/supabaseService';

const App: React.FC = () => {
  // App States: 'LOGIN' | 'UPLOAD' | 'APP'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<StoreData | null>(null);
  const [currentView, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        loadUserData();
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
         loadUserData();
      } else {
         setData(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async () => {
    try {
        setIsLoading(true);
        const storeData = await fetchRealStoreData();
        if (storeData) {
            setData(storeData);
        }
    } catch (e) {
        console.error("Erro ao carregar dados do usuário:", e);
    } finally {
        setIsLoading(false);
    }
  };

  // Handlers
  const handleLogin = () => {
    // Auth state listener handles the transition
  };

  const handleLogout = () => {
    signOut();
    setIsAuthenticated(false);
    setData(null);
    setView(ViewState.DASHBOARD);
  };

  const handleDataLoaded = (loadedData: StoreData) => {
    setData(loadedData);
  };

  const handleResetData = () => {
    // Allows user to upload more data or replace data
    // In a real app, we might want a different UI for this, but reusing UploadView is fine.
    setData(null);
    setView(ViewState.DASHBOARD);
  };

  if (isLoading) {
      return (
          <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#002D39' }}>
              <div className="w-12 h-12 border-4 border-[#49FFBD]/30 border-t-[#49FFBD] rounded-full animate-spin"></div>
          </div>
      );
  }

  // 1. Not Authenticated -> Show Login
  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  // 2. Authenticated but No Data -> Show Upload
  if (!data) {
    return <UploadView onDataLoaded={handleDataLoaded} />;
  }

  // 3. Authenticated & Data Loaded -> Show Main App
  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <DashboardView data={data} />;
      case ViewState.INSIGHTS:
        return <InsightsView data={data} />;
      case ViewState.INVENTORY:
        return <InventoryView data={data} />;
      default:
        return <DashboardView data={data} />;
    }
  };

  return (
    <Layout 
        currentView={currentView} 
        setView={setView} 
        onLogout={handleLogout}
        onUploadNew={handleResetData}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;