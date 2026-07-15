import React, { useState, useEffect } from 'react';

const InventoryModal = ({ item, onSave, onClose }) => {
  // Estado del formulario
  const [form, setForm] = useState({
    name: '',
    unit: 'pza',
    quantity: 0,
    min_stock: 0,
    avg_cost: 0,
    supplier: '',
    active: true
  });

  // Si hay item, cargar sus datos
  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        unit: item.unit || 'pza',
        quantity: item.quantity || 0,
        min_stock: item.min_stock || 0,
        avg_cost: item.avg_cost || 0,
        supplier: item.supplier || '',
        active: item.active ?? true
      });
    }
  }, [item]);

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  // Enviar formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* Cabecera del modal */}
        <div className="modal-header">
          <h3>{item ? '✏️ Editar Ingrediente' : '➕ Nuevo Ingrediente'}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        
        {/* Cuerpo del formulario */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Nombre */}
            <div className="form-group">
              <label>Nombre del ingrediente *</label>
              <input
                type="text"
                name="name"
                className="input"
                value={form.name}
                onChange={handleChange}
                placeholder="Ej: Carne de res, Cebolla, Aceite..."
                required
                autoFocus
              />
            </div>

            {/* Unidad y Stock Mínimo */}
            <div className="form-row">
              <div className="form-group">
                <label>Unidad de medida *</label>
                <select
                  name="unit"
                  className="input"
                  value={form.unit}
                  onChange={handleChange}
                  required
                >
                  <option value="pza">Pieza (pza)</option>
                  <option value="kg">Kilogramo (kg)</option>
                  <option value="g">Gramo (g)</option>
                  <option value="ml">Mililitro (ml)</option>
                  <option value="l">Litro (l)</option>
                  <option value="oz">Onza (oz)</option>
                  <option value="lb">Libra (lb)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Stock mínimo</label>
                <input
                  type="number"
                  name="min_stock"
                  className="input"
                  value={form.min_stock}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Alerta cuando baje de..."
                />
              </div>
            </div>

            {/* Cantidad y Costo */}
            <div className="form-row">
              <div className="form-group">
                <label>Existencia inicial</label>
                <input
                  type="number"
                  name="quantity"
                  className="input"
                  value={form.quantity}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Costo promedio</label>
                <input
                  type="number"
                  name="avg_cost"
                  className="input"
                  value={form.avg_cost}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Proveedor */}
            <div className="form-group">
              <label>Proveedor</label>
              <input
                type="text"
                name="supplier"
                className="input"
                value={form.supplier}
                onChange={handleChange}
                placeholder="Nombre del proveedor..."
              />
            </div>

            {/* Activo */}
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />
                <span>Ingrediente activo</span>
              </label>
            </div>
          </div>

          {/* Botones del modal */}
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {item ? '💾 Actualizar' : '💾 Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryModal;