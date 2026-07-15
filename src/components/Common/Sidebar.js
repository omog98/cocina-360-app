import React from 'react';
import './Sidebar.css';

const Sidebar = ({ isOpen, setCurrentView, currentView }) => {
  const configOptions = [
    { key: 'products', label: 'Productos', icon: '📦' },
    { key: 'categories', label: 'Categorías', icon: '📁' },
    { key: 'production', label: 'Producción', icon: '🏭' },
    { key: 'recipes', label: 'Recetas', icon: '📝' },
    { key: 'promotions', label: 'Promociones', icon: '🏷️' },
    { key: 'ticket-config', label: 'Ticket', icon: '🧾' },
    { key: 'users', label: 'Usuarios', icon: '👥' },
    { key: 'company', label: 'Empresa', icon: '🏢' },
    { key: 'branches', label: 'Sucursales', icon: '🏪' },
    { key: 'backups', label: 'Respaldos', icon: '💾' },
    { key: 'reset', label: 'Reiniciar', icon: '🔄' },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-title">Configuración</div>
      <nav className="sidebar-nav">
        {configOptions.map(option => (
          <button
            key={option.key}
            className={`sidebar-btn ${currentView === option.key ? 'active' : ''}`}
            onClick={() => setCurrentView(option.key)}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;