import React, { useState, useEffect } from 'react';
import Header from './components/Common/Header';
import Sidebar from './components/Common/Sidebar';
import ProductsView from './components/Products/ProductsView';
import CategoriesView from './components/Categories/CategoriesView';
import InventoryView from './components/Inventory/InventoryView';
import RecipesView from './components/Recipes/RecipesView';
import TablesView from './components/Sales/TablesView';
import TakeoutView from './components/Sales/TakeoutView';
import DashboardView from './components/Reports/DashboardView';
import ReportsView from './components/Reports/ReportsView';
import CompanyView from './components/Company/CompanyView';
import UsersView from './components/Config/UsersView';
import BranchesView from './components/Config/BranchesView';
import ResetView from './components/Config/ResetView';
import CombosView from './components/Combos/CombosView';
import PromotionsView from './components/Promotions/PromotionsView';
import TicketConfig from './components/Ticket/TicketConfig';
import ProductionView from './components/Production/ProductionView';
import KitchenView from './components/Kitchen/KitchenView';
import LoginView from './components/Auth/LoginView';
import AccessDenied from './components/Common/AccessDenied';
import supabase from './services/supabaseClient';
import { AppProvider } from './context/AppContext';
import './styles/components.css';

function AppContent() {
  const [currentView, setCurrentView] = useState('tables');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const savedUser = localStorage.getItem('cocina360_user');
    const savedProfile = localStorage.getItem('cocina360_profile');
    if (savedUser && savedProfile) {
      setUser(JSON.parse(savedUser));
      setProfile(JSON.parse(savedProfile));
    }
    setLoading(false);
  };

  const autoCheckIn = async (prof) => {
    try {
      const { data: active } = await supabase
        .from('attendance')
        .select('*')
        .eq('profile_id', prof.id)
        .eq('status', 'active')
        .single();
      if (!active) {
        await supabase.from('attendance').insert([{
          profile_id: prof.id,
          check_in: new Date(),
          status: 'active'
        }]);
      }
    } catch (err) {
      console.error('Auto check-in:', err);
    }
  };

  const handleLogin = (userData, profileData) => {
    setUser(userData);
    setProfile(profileData);
    localStorage.setItem('cocina360_user', JSON.stringify(userData));
    localStorage.setItem('cocina360_profile', JSON.stringify(profileData));
    autoCheckIn(profileData);
  };

  const handleLogout = async () => {
    if (profile) {
      try {
        const { data: active } = await supabase
          .from('attendance')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('status', 'active')
          .single();
        if (active) {
          const checkOut = new Date();
          const checkIn = new Date(active.check_in);
          const hoursWorked = (checkOut - checkIn) / (1000 * 60 * 60);
          let overtime = hoursWorked > 8 ? hoursWorked - 8 : 0;
          await supabase.from('attendance').update({
            check_out: checkOut,
            hours_worked: Math.round(hoursWorked * 100) / 100,
            overtime: Math.round(overtime * 100) / 100,
            status: 'completed'
          }).eq('id', active.id);
        }
      } catch (err) {
        console.error('Auto check-out:', err);
      }
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem('cocina360_user');
    localStorage.removeItem('cocina360_profile');
    setCurrentView('tables');
  };

  const renderView = () => {
    const role = profile?.role || 'mesero';
    const permissions = profile?.permissions || {};

    if (role === 'admin') {
      switch(currentView) {
        case 'tables': return <TablesView />;
        case 'takeout': return <TakeoutView />;
        case 'delivery': return <TakeoutView delivery={true} />;
        case 'inventory': return <InventoryView user={profile} />;
        case 'dashboard': return <DashboardView />;
        case 'reports': return <ReportsView />;
        case 'products': return <ProductsView />;
        case 'categories': return <CategoriesView />;
        case 'recipes': return <RecipesView />;
        case 'combos': return <CombosView />;
        case 'promotions': return <PromotionsView />;
        case 'company': return <CompanyView />;
        case 'users': return <UsersView />;
        case 'branches': return <BranchesView />;
        case 'reset': return <ResetView />;
        case 'kitchen': return <KitchenView />;
        case 'ticket-config': return <TicketConfig />;
        case 'production': return <ProductionView />;
        default: return <TablesView />;
      }
    }

    const viewPermissions = {
      tables: { component: <TablesView />, perm: 'tables' },
      takeout: { component: <TakeoutView />, perm: 'takeout' },
      delivery: { component: <TakeoutView delivery={true} />, perm: 'delivery' },
      inventory: { component: <InventoryView user={profile} />, perm: 'inventory_view' },
      kitchen: { component: <KitchenView />, perm: 'kitchen' },
      dashboard: { component: <DashboardView />, perm: 'dashboard' },
      reports: { component: <ReportsView />, perm: 'reports' },
      products: { component: <ProductsView />, perm: 'products' },
      categories: { component: <CategoriesView />, perm: 'categories' },
      recipes: { component: <RecipesView />, perm: 'recipes' },
      combos: { component: <CombosView />, perm: 'combos' },
      promotions: { component: <PromotionsView />, perm: 'promotions' },
      company: { component: <CompanyView />, perm: 'company' },
      production: { component: <ProductionView />, perm: 'production' },
    };

    const view = viewPermissions[currentView];
    if (view && permissions[view.perm]) {
      return view.component;
    }

    if (currentView !== 'tables' && currentView !== 'kitchen') {
      return <AccessDenied />;
    }

    if (role === 'cocinero') return <KitchenView />;
    return <TablesView />;
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ height: '100vh' }}>
        <div className="loading-spinner">🔄</div>
        <p>Cargando Cocina 360°...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <Header 
        setCurrentView={setCurrentView} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        user={profile}
        onLogout={handleLogout}
      />
      <div className="main-content">
        <Sidebar 
          isOpen={sidebarOpen} 
          setCurrentView={setCurrentView}
          currentView={currentView}
          role={profile?.role}
        />
        <main className="view-container">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;