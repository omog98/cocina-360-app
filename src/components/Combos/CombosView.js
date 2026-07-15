import React from 'react';

const CombosView = () => {
  return (
    <div className="view">
      <div className="view-header">
        <h2>🎉 Combos</h2>
        <p className="view-subtitle">Módulo en desarrollo</p>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: 60, marginTop: 20 }}>
        <p style={{ fontSize: 50, marginBottom: 15 }}>🎉</p>
        <p style={{ fontSize: 18 }}>Gestión de Combos</p>
        <p style={{ color: 'var(--text-secondary)', marginTop: 10 }}>
          Disponible próximamente
        </p>
      </div>
    </div>
  );
};

export default CombosView;