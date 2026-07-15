import React, { useState, useEffect } from 'react';

const CategoryModal = ({ category, onSave, onClose }) => {
  const [form, setForm] = useState({
    name: '',
    color: '#1a73e8',
    order: 0,
    active: true
  });

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || '',
        color: category.color || '#1a73e8',
        order: category.order || 0,
        active: category.active ?? true
      });
    }
  }, [category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{category ? '✏️ Editar Categoría' : '➕ Nueva Categoría'}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nombre *</label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Color</label>
              <div className="color-input">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({...form, color: e.target.value})}
                />
                <span>{form.color}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Orden</label>
              <input
                type="number"
                className="input"
                value={form.order}
                onChange={(e) => setForm({...form, order: parseInt(e.target.value) || 0})}
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({...form, active: e.target.checked})}
                />
                <span>Activo</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {category ? '💾 Actualizar' : '💾 Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;