import React from 'react';

const AccessDenied = () => {
  return (
    <div className="view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 20 }}>🔒</div>
        <h2 style={{ color: '#e74c3c', marginBottom: 10 }}>Acceso Restringido</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
          No tienes permisos para acceder a este módulo.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 10 }}>
          Contacta al administrador para solicitar acceso.
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;