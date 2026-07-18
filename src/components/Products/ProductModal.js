import React, { useState, useEffect } from 'react';
import supabase from '../../services/supabaseClient';

const ComboItemsSelector = ({ productId, onChange }) => {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProducts();
    if (productId) loadExistingItems();
    // eslint-disable-next-line
}, [productId]);

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').eq('active', true);
    setProducts(data || []);
  };

  const loadExistingItems = async () => {
    const { data } = await supabase.from('combo_items').select('*, products:product_id(name)').eq('combo_id', productId);
    if (data) {
      setItems(data.map(i => ({
        product_id: i.product_id,
        product_name: i.products?.name,
        quantity: i.quantity
      })));
      onChange(data.map(i => ({
        product_id: i.product_id,
        product_name: i.products?.name,
        quantity: i.quantity
      })));
    }
  };

  const addItem = () => {
    if (!selectedProduct) return;
    const product = products.find(p => p.id === selectedProduct);
    const newItems = [...items, { product_id: selectedProduct, product_name: product?.name, quantity }];
    setItems(newItems);
    onChange(newItems);
    setSelectedProduct('');
    setQuantity(1);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onChange(newItems);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <select className="input" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} style={{ flex: 1 }}>
          <option value="">Seleccionar producto...</option>
          {products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
        </select>
        <input type="number" className="input" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} min="1" style={{ width: 60 }} />
        <button type="button" className="btn btn-primary btn-sm" onClick={addItem}>+</button>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', background: 'var(--medium)', borderRadius: 5, marginBottom: 3, fontSize: 13 }}>
          <span>{item.quantity}x {item.product_name}</span>
          <button type="button" onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>✕</button>
        </div>
      ))}
    </div>
  );
};

const ProductModal = ({ product, onSave, onClose }) => {
  const [form, setForm] = useState({
    name: '', description: '', price: 0, cost: 0, sku: '',
    category_id: null, preparation_time: 10, active: true,
    control_inventory: false, order: 0, is_combo: false, combo_price: 0,
    delivery_price: 0
  });
  const [comboItems, setComboItems] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCategories();
    if (product) {
      setForm({
        name: product.name || '', description: product.description || '',
        price: product.price || 0, cost: product.cost || 0, sku: product.sku || '',
        category_id: product.category_id || null, preparation_time: product.preparation_time || 10,
        active: product.active ?? true, control_inventory: product.control_inventory || false,
        order: product.order || 0, is_combo: product.is_combo || false, combo_price: product.combo_price || 0,
        delivery_price: product.delivery_price || 0
      });
    }
  }, [product]);

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').eq('active', true).order('name');
    setCategories(data || []);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) { alert('El nombre es requerido'); return; }
    onSave(form, comboItems);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h3>{product ? '✏️ Editar Producto' : '📦 Nuevo Producto'}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nombre *</label>
              <input type="text" name="name" className="input" value={form.name} onChange={handleChange} required autoFocus />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea name="description" className="input" value={form.description} onChange={handleChange} rows="2" />
            </div>

            <div className="form-group">
              <label>Categoría</label>
              <select name="category_id" className="input" value={form.category_id || ''} onChange={handleChange}>
                <option value="">Sin categoría</option>
                {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Precio base * (Comedor y Para Llevar)</label>
                <input type="number" name="price" className="input" value={form.price} onChange={handleChange} step="0.01" required />
              </div>
              <div className="form-group">
                <label>🛵 Precio Delivery</label>
                <input type="number" name="delivery_price" className="input" value={form.delivery_price || 0} onChange={handleChange} step="0.01" />
                <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3 }}>Deja en 0 para usar precio base</p>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Costo</label>
                <input type="number" name="cost" className="input" value={form.cost} onChange={handleChange} step="0.01" />
              </div>
              <div className="form-group">
                <label>SKU</label>
                <input type="text" name="sku" className="input" value={form.sku} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tiempo de preparación (min)</label>
                <input type="number" name="preparation_time" className="input" value={form.preparation_time} onChange={handleChange} min="1" />
              </div>
              <div className="form-group">
                <label>Orden</label>
                <input type="number" name="order" className="input" value={form.order} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" name="is_combo" checked={form.is_combo} onChange={handleChange} />
                <span>🎉 Este producto es un COMBO</span>
              </label>
            </div>

            {form.is_combo && (
              <>
                <div className="form-group">
                  <label>Precio del combo *</label>
                  <input type="number" name="combo_price" className="input" value={form.combo_price} onChange={handleChange} step="0.01" />
                </div>
                <div className="form-group">
                  <label>Productos que incluye el combo</label>
                  <ComboItemsSelector productId={product?.id} onChange={(items) => setComboItems(items)} />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" name="control_inventory" checked={form.control_inventory} onChange={handleChange} />
                <span>Controla inventario</span>
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
                <span>Producto activo</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{product ? '💾 Actualizar' : '💾 Crear Producto'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;