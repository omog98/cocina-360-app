import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';

const InventoryMovements = ({ item, onAddMovement, onClose }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [movement, setMovement] = useState({
    inventory_id: item.id,
    type: 'entrada',
    quantity: 0,
    reason: ''
  });

  // Cargar historial de movimientos
 useEffect(() => {
    loadMovements();
    // eslint-disable-next-line
}, []);
  const loadMovements = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getMovements(item.id);
      setMovements(data);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Registrar nuevo movimiento
  const handleSubmit = (e) => {
    e.preventDefault();
    if (movement.quantity <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }
    onAddMovement(movement);
    setMovement({
      inventory_id: item.id,
      type: 'entrada',
      quantity: 0,
      reason: ''
    });
    setShowForm(false);
    loadMovements();
  };

  // Obtener etiqueta del tipo de movimiento
  const getTypeLabel = (type) => {
    switch(type) {
      case 'entrada': return { label: 'Entrada', color: 'badge-success', icon: '📥' };
      case 'salida': return { label: 'Salida', color: 'badge-danger', icon: '📤' };
      case 'ajuste': return { label: 'Ajuste', color: 'badge-primary', icon: '🔧' };
      case 'merma': return { label: 'Merma', color: 'badge-warning', icon: '🗑️' };
      default: return { label: type, color: 'badge-primary', icon: '📦' };
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={e => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="modal-header">
          <div>
            <h3>📋 Movimientos: {item.name}</h3>
            <p className="modal-subtitle">
              Stock actual: <strong>{item.quantity} {item.unit}</strong>
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Botón nuevo movimiento */}
          <div className="movements-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '❌ Cancelar' : '➕ Nuevo Movimiento'}
            </button>
          </div>

          {/* Formulario de movimiento */}
          {showForm && (
            <div className="movement-form">
              <h4>Registrar Movimiento</h4>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo de movimiento</label>
                    <select
                      className="input"
                      value={movement.type}
                      onChange={(e) => setMovement({...movement, type: e.target.value})}
                    >
                      <option value="entrada">📥 Entrada</option>
                      <option value="salida">📤 Salida</option>
                      <option value="ajuste">🔧 Ajuste</option>
                      <option value="merma">🗑️ Merma</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Cantidad ({item.unit})</label>
                    <input
                      type="number"
                      className="input"
                      value={movement.quantity}
                      onChange={(e) => setMovement({...movement, quantity: parseFloat(e.target.value) || 0})}
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Motivo o nota</label>
                  <input
                    type="text"
                    className="input"
                    value={movement.reason}
                    onChange={(e) => setMovement({...movement, reason: e.target.value})}
                    placeholder="Ej: Compra semanal, Merma por caducidad..."
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  💾 Registrar Movimiento
                </button>
              </form>
            </div>
          )}

          {/* Historial de movimientos */}
          <div className="movements-history">
            <h4>Historial</h4>
            {loading ? (
              <p className="text-center">Cargando historial...</p>
            ) : movements.length === 0 ? (
              <p className="text-center text-secondary">Sin movimientos registrados</p>
            ) : (
              <div className="movements-list">
                {movements.map(mov => {
                  const typeInfo = getTypeLabel(mov.type);
                  return (
                    <div key={mov.id} className="movement-item">
                      <div className="movement-icon">
                        {typeInfo.icon}
                      </div>
                      <div className="movement-info">
                        <div className="movement-header">
                          <span className={`badge ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          <span className="movement-quantity">
                            {mov.type === 'entrada' ? '+' : '-'}{mov.quantity} {item.unit}
                          </span>
                        </div>
                        {mov.reason && (
                          <p className="movement-reason">{mov.reason}</p>
                        )}
                        <span className="movement-date">
                          {new Date(mov.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryMovements;