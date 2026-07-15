import React, { useState, useEffect } from 'react';
import supabase from '../../services/supabaseClient';

const PromotionModal = ({ promotion, onSave, onClose }) => {
  const [form, setForm] = useState({
    name: '',
    type: 'percentage',
    value: 0,
    product_id: null,
    free_product_id: null,
    cross_sell_product_id: null,
    cross_sell_discount: 100,
    applies_to: 'all',
    min_quantity: 1,
    min_amount: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    usage_limit: '',
    active: true
  });
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadProducts();
    if (promotion) {
      setForm({
        name: promotion.name || '',
        type: promotion.type || 'percentage',
        value: promotion.value || 0,
        product_id: promotion.product_id || null,
        free_product_id: promotion.free_product_id || null,
        cross_sell_product_id: promotion.cross_sell_product_id || null,
        cross_sell_discount: promotion.cross_sell_discount || 100,
        applies_to: promotion.applies_to || 'all',
        min_quantity: promotion.min_quantity || 1,
        min_amount: promotion.min_amount || 0,
        start_date: promotion.start_date ? promotion.start_date.split('T')[0] : '',
        end_date: promotion.end_date ? promotion.end_date.split('T')[0] : '',
        usage_limit: promotion.usage_limit || '',
        active: promotion.active ?? true
      });
    }
    // eslint-disable-next-line
  }, [promotion]);

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').eq('active', true).order('name');
    setProducts(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      alert('El nombre es requerido');
      return;
    }

    const dataToSave = {
      name: form.name,
      type: form.type,
      value: form.value,
      product_id: form.product_id || null,
      free_product_id: form.free_product_id || null,
      cross_sell_product_id: form.cross_sell_product_id || null,
      cross_sell_discount: form.cross_sell_discount,
      applies_to: form.applies_to,
      min_quantity: form.min_quantity,
      min_amount: form.min_amount,
      start_date: form.start_date || new Date().toISOString(),
      end_date: form.end_date || null,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      active: form.active
    };

    onSave(dataToSave);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 550 }}>
        <div className="modal-header">
          <h3>{promotion ? '✏️ Editar Promoción' : '🏷️ Nueva Promoción'}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nombre *</label>
              <input type="text" className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required autoFocus />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tipo</label>
                <select className="input" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                  <option value="percentage">% Descuento</option>
                  <option value="buy_one_get_one">2x1</option>
                  <option value="free_product">Producto Gratis</option>
                  <option value="amount_discount">Descuento $</option>
                </select>
              </div>
              <div className="form-group">
                <label>Valor</label>
                <input type="number" className="input" value={form.value} onChange={(e) => setForm({...form, value: parseFloat(e.target.value) || 0})} step="0.01" />
              </div>
            </div>

            <div className="form-group">
              <label>Producto (vacío = todos)</label>
              <select className="input" value={form.product_id || ''} onChange={(e) => setForm({...form, product_id: e.target.value || null})}>
                <option value="">Todos los productos</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {form.type === 'free_product' && (
              <div className="form-group">
                <label>Producto gratis</label>
                <select className="input" value={form.free_product_id || ''} onChange={(e) => setForm({...form, free_product_id: e.target.value || null})}>
                  <option value="">Seleccionar...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Aplica en</label>
              <select className="input" value={form.applies_to} onChange={(e) => setForm({...form, applies_to: e.target.value})}>
                <option value="all">Todos</option>
                <option value="dine_in">🪑 Solo Comedor</option>
                <option value="takeout">🛍️ Solo Para Llevar</option>
                <option value="delivery">🛵 Solo Delivery</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Cantidad mínima</label>
                <input type="number" className="input" value={form.min_quantity || 1} onChange={(e) => setForm({...form, min_quantity: parseInt(e.target.value) || 1})} min="1" />
              </div>
              <div className="form-group">
                <label>Límite de usos</label>
                <input type="number" className="input" value={form.usage_limit || ''} onChange={(e) => setForm({...form, usage_limit: e.target.value || null})} placeholder="Ilimitado" />
              </div>
            </div>

            <div className="form-group">
              <label>Venta Cruzada - Producto requerido</label>
              <select className="input" value={form.cross_sell_product_id || ''} onChange={(e) => setForm({...form, cross_sell_product_id: e.target.value || null})}>
                <option value="">Ninguno</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {form.cross_sell_product_id && (
              <div className="form-group">
                <label>Descuento del producto cruzado (%)</label>
                <input type="number" className="input" value={form.cross_sell_discount || 100} onChange={(e) => setForm({...form, cross_sell_discount: parseFloat(e.target.value) || 0})} />
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 5 }}>100% = Gratis, 50% = Mitad de precio</p>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Fecha inicio</label>
                <input type="date" className="input" value={form.start_date || ''} onChange={(e) => setForm({...form, start_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Fecha fin</label>
                <input type="date" className="input" value={form.end_date || ''} onChange={(e) => setForm({...form, end_date: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({...form, active: e.target.checked})} />
                <span>Activo</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">💾 Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromotionModal;