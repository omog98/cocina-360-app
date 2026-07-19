import React from 'react';
import './Header.css';

const Header = ({ setCurrentView, toggleSidebar, user, onLogout }) => {
  const role = user?.role || 'mesero';
  const permissions = user?.permissions || {};

  const allOptions = [
    { key: 'tables', label: 'Comedor', icon: '🪑', perm: 'tables' },
    { key: 'takeout', label: 'Para Llevar', icon: '🛍️', perm: 'takeout' },
    { key: 'delivery', label: 'Delivery', icon: '🛵', perm: 'delivery' },
    { key: 'inventory', label: 'Inventario', icon: '📦', perm: 'inventory' },
    { key: 'kitchen', label: 'Cocina', icon: '🍳', perm: 'kitchen' },
    { key: 'dashboard', label: 'Dashboard', icon: '📊', perm: 'dashboard' },
  ];

  const mainOptions = role === 'admin' ? allOptions : allOptions.filter(opt => permissions[opt.perm]);

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={toggleSidebar}>☰</button>
        <div className="brand">
          <h1>COCINA 360°</h1>
          <span className="brand-subtitle">Phillis Cheesesteaks</span>
        </div>
      </div>
      
      <nav className="header-nav">
        {mainOptions.map(option => (
          <button key={option.key} className="nav-btn" onClick={() => setCurrentView(option.key)}>
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </nav>

      <div className="header-right">
        {user && (
          <div className="user-info">
            <span className="user-role-badge">{user.role}</span>
            <span className="user-name">{user.full_name}</span>
            <button className="btn btn-sm btn-secondary" onClick={onLogout}>🚪</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;