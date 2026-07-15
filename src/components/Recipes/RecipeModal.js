import React, { useState, useEffect } from 'react';

const RecipeModal = ({ recipe, product, inventory, onSave, onClose }) => {
  const [form, setForm] = useState({
    product_id: product?.id || '',
    inventory_id: '',
    quantity: 0,
    unit: ''
  });

  useEffect(() => {
    if (recipe) {
      setForm({
        product_id: recipe.product_id,
        inventory_id: recipe.inventory_id,
        quantity: recipe.quantity,
        unit: recipe.unit || ''
      });
    } else if (product) {
      setForm(prev => ({ ...prev, product_id: product.id }));
    }
  }, [recipe, product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseFloat(value) || 0 : value
    }));

    // Auto-seleccionar unidad del inventario
    if (name === 'inventory_id' && value) {
      const selectedItem = inventory.find(i => i.id === value);
      if (selectedItem) {
        setForm(prev => ({ ...prev, unit: selectedItem.unit }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.inventory_id) {
      alert('Selecciona un ingrediente');
      return;
    }
    if (form.quantity <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{recipe ? '✏️ Editar Ingrediente' : '➕ Agregar Ingrediente'}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ marginBottom: 15, color: 'var(--text-secondary)' }}>
              Producto: <strong>{product?.name}</strong>
            </p>

            <div className="form-group">
              <label>Ingrediente *</label>
              <select
                name="inventory_id"
                className="input"
                value={form.inventory_id}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar ingrediente...</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Stock: {item.quantity} {item.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Cantidad *</label>
                <input
                  type="number"
                  name="quantity"
                  className="input"
                  value={form.quantity}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  placeholder="Ej: 180"
                  required
                />
              </div>

              <div className="form-group">
                <label>Unidad</label>
                <input
                  type="text"
                  name="unit"
                  className="input"
                  value={form.unit}
                  onChange={handleChange}
                  placeholder="Auto-seleccionada"
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {recipe ? '💾 Actualizar' : '💾 Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecipeModal;