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
    }
  };

  const addItem = () => {
    if (!selectedProduct) return;
    const product = products.find(p => p.id === selectedProduct);
    const newItems = [...items, {
      product_id: selectedProduct,
      product_name: product?.name,
      quantity
    }];
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
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
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

export default ComboItemsSelector;