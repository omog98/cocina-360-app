import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { salesService } from '../../services/salesService';
import { recipeService } from '../../services/recipeService';
import supabase from '../../services/supabaseClient';
import PaymentModal from './PaymentModal';
import { useApp } from '../../context/AppContext';

const TakeoutView = ({ delivery = false }) => {
  const [products, setProducts] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [folio, setFolio] = useState('');
  const [manualFolio, setManualFolio] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [sentToKitchen, setSentToKitchen] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [platform, setPlatform] = useState('uber');
  const [activePromo, setActivePromo] = useState(null);
  const [promos, setPromos] = useState([]);
  const [showPromos, setShowPromos] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const { showToast } = useApp();

  useEffect(() => {
    loadProducts();
    loadActiveOrder();
    // eslint-disable-next-line
  }, []);

  const loadActiveOrder = async () => {
    if (cancelled) return;
    try {
      const type = delivery ? 'delivery' : 'takeout';
      const result = await salesService.getActiveOrderByType(type);
      const data = result?.data;
      if (data && data.length > 0) {
        const order = data[0];
        setOrderId(order.id);
        setCustomerName(order.customer_name || '');
        setCustomerPhone(order.customer_phone || '');
        setFolio(order.folio || '');
        setEstimatedTime(order.estimated_time || 0);
        setSentToKitchen(true);
        const items = (order.order_items || []).map(item => ({ ...item, isNew: false, sent_to_kitchen: true }));
        setOrderItems(items);
      } else {
        if (!delivery) generateFolio();
      }
    } catch (error) {
      console.error(error);
      if (!delivery) generateFolio();
    } finally {
      setLoadingOrder(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data.filter(p => p.active).map(p => ({...p, isCombo: p.is_combo})));
      const cats = [...new Set(data.map(p => p.categories?.name).filter(Boolean))];
      setCategories(cats);
      const now = new Date().toISOString();
      const orderType = delivery ? 'delivery' : 'takeout';
      const { data: promosData } = await supabase
        .from('promotions')
        .select('*, product:product_id(name), free_product:free_product_id(name)')
        .eq('active', true)
        .or('applies_to.eq.all,applies_to.eq.' + orderType)
        .lte('start_date', now)
        .or('end_date.is.null,end_date.gte.' + now);
      setPromos(promosData || []);
    } catch (error) {
      showToast('Error al cargar productos', 'error');
    }
  };

  const generateFolio = async () => { try { const data = await salesService.getNextFolio(); setFolio(String(data || 1)); } catch (error) { setFolio('1'); } };

  const addToOrder = (product) => {
    if (sentToKitchen) return;
    const existing = orderItems.find(item => item.product_id === product.id && item.isNew);
    const finalPrice = product.isCombo 
      ? (delivery && product.combo_delivery_price > 0 ? product.combo_delivery_price : product.combo_price)
      : (delivery && product.delivery_price > 0 ? product.delivery_price : product.price);
    
    if (existing) {
      setOrderItems(orderItems.map(item =>
        item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setOrderItems([...orderItems, {
        product_id: product.id, product_name: (product.isCombo ? '🎉 ' : '') + product.name,
        price: finalPrice, quantity: 1, notes: '', preparation_time: product.preparation_time || 5,
        isPromo: false, isCombo: product.isCombo, isNew: true
      }]);
    }
    updateTime();
  };

  const updateQuantity = (productId, delta) => {
    if (sentToKitchen) return;
    setOrderItems(orderItems.map(item => {
      if (item.product_id === productId) { const newQty = item.quantity + delta; return newQty > 0 ? { ...item, quantity: newQty } : null; }
      return item;
    }).filter(Boolean));
    updateTime();
  };

  const removeItem = (productId) => { if (sentToKitchen) return; setOrderItems(orderItems.filter(item => item.product_id !== productId)); updateTime(); };

  const updateTime = () => { const totalTime = orderItems.reduce((sum, item) => sum + ((item.preparation_time || 5) * item.quantity), 0); setEstimatedTime(totalTime); };

  const handleApplyPromo = (promo) => {
    if (activePromo) { showToast('Ya hay una promoción aplicada', 'error'); return; }
    if (promo.product_id) { const hasProduct = orderItems.find(item => item.product_id === promo.product_id); if (!hasProduct) { showToast('Necesitas agregar: ' + (promo.product?.name || 'el producto requerido') + ' primero', 'error'); return; } }
    if (promo.type === 'free_product' && promo.free_product_id) {
      const freeProduct = products.find(p => p.id === promo.free_product_id);
      if (freeProduct) { setOrderItems(prev => [...prev, { product_id: freeProduct.id, product_name: '🎁 ' + freeProduct.name + ' (PROMO)', price: 0, quantity: 1, notes: 'Promo: ' + promo.name, status: 'pending', isNew: true, sent_to_kitchen: false, isPromo: true, preparation_time: freeProduct.preparation_time || 5 }]); setActivePromo(promo); showToast('🎁 ' + freeProduct.name + ' agregado'); }
    } else if (promo.type === 'percentage') { setActivePromo(promo); showToast('🏷️ ' + promo.value + '% descuento'); }
    else if (promo.type === 'amount_discount') { setActivePromo(promo); showToast('💵 $' + promo.value + ' descuento'); }
  };

  const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let finalTotal = total;
  if (activePromo) { if (activePromo.type === 'percentage') finalTotal = total - (total * activePromo.value / 100); else if (activePromo.type === 'amount_discount') finalTotal = Math.max(0, total - activePromo.value); }

  const handleSendToKitchen = async () => {
    try {
      if (orderItems.length === 0) { showToast('Agrega productos primero', 'error'); return; }
      if (!customerName.trim()) { showToast('Ingresa el nombre del cliente', 'error'); return; }
      const finalFolio = delivery ? manualFolio : folio;
      const order = await salesService.createOrder({ table_id: null, type: delivery ? 'delivery' : 'takeout', customer_name: customerName, customer_phone: customerPhone, folio: finalFolio, platform: delivery ? platform : null, estimated_time: estimatedTime, subtotal: finalTotal, tax: 0, total: finalTotal, status: 'open', payment_status: 'pending' });
      const newOrderId = order.id; setOrderId(newOrderId);
      
      for (const item of orderItems) {
        await salesService.addOrderItem({ order_id: newOrderId, product_id: item.product_id, product_name: item.product_name, quantity: item.quantity, price: item.price, notes: item.notes || '', status: 'pending', sent_to_kitchen: true, preparation_time: item.preparation_time || 5 });
        if (item.isCombo) {
          const { data: comboItems } = await supabase.from('combo_items').select('*, products:product_id(name)').eq('combo_id', item.product_id);
          if (comboItems && comboItems.length > 0) {
            for (const ci of comboItems) {
              await salesService.addOrderItem({ order_id: newOrderId, product_id: ci.product_id, product_name: '  └ ' + (ci.products?.name || 'Producto'), quantity: ci.quantity || 1, price: 0, notes: '', status: 'pending', sent_to_kitchen: true });
            }
          }
        }
      }
      setSentToKitchen(true);
      setCancelled(false);
      try { await recipeService.discountInventory(newOrderId); } catch (err) { }
      showToast('🧾 Pedido #' + finalFolio + ' enviado a cocina. ⏱️ ' + estimatedTime + ' min');
    } catch (error) { showToast('Error al enviar a cocina', 'error'); }
  };

  const handlePayment = async (payments, tip) => {
    try { if (!orderId) { showToast('Primero envía a cocina', 'error'); return; } const paymentMethods = payments.map(p => p.method).join(' + '); await salesService.closeOrder(orderId, { method: paymentMethods, total: finalTotal, tip: tip || 0 }); if (activePromo) { try { await supabase.from('promotions').update({ times_used: (activePromo.times_used || 0) + 1 }).eq('id', activePromo.id); } catch (err) {} } showToast('✅ Pedido cobrado - $' + finalTotal.toFixed(2)); clearOrder(); } catch (error) { showToast('Error al cobrar', 'error'); }
  };

  const clearOrder = () => { setOrderItems([]); setCustomerName(''); setCustomerPhone(''); setSentToKitchen(false); setOrderId(null); setEstimatedTime(0); setShowPayment(false); setActivePromo(null); setPlatform('uber'); setCancelled(true); if (!delivery) generateFolio(); if (delivery) setManualFolio(''); };

  const getPlatformLabel = (plat) => { switch(plat) { case 'uber': return '🛵 Uber Eats'; case 'didi': return '🛵 DiDi Food'; case 'rappi': return '🛵 Rappi'; default: return plat; } };

  const filteredProducts = selectedCategory === 'all' ? products : products.filter(p => p.categories?.name === selectedCategory);
  if (loadingOrder) return <div className="loading-container"><div className="loading-spinner">🔄</div><p>Cargando...</p></div>;

  return (
    <div className="view">
      <div className="view-header"><div><h2>{delivery ? '🛵 Delivery' : '🛍️ Para Llevar'}</h2><p className="view-subtitle">{delivery ? getPlatformLabel(platform) + ' | Folio manual' : 'Folio #' + folio}</p></div><div>{estimatedTime > 0 && <span className="badge badge-warning" style={{ fontSize: 14, padding: '8px 15px' }}>⏱️ {estimatedTime} min</span>}</div></div>
      <div className="order-layout">
        <div className="order-menu">
          {promos.length > 0 && (<div style={{ marginBottom: 10 }}><button onClick={() => setShowPromos(!showPromos)} style={{ background: showPromos ? '#FF6B35' : 'var(--medium)', border: 'none', color: 'white', padding: '8px 15px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>🏷️ Promociones ({promos.length})</button>{showPromos && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0' }}>{promos.map(promo => <button key={promo.id} onClick={() => handleApplyPromo(promo)} style={{ background: '#e74c3c', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 15, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}>🏷️ {promo.name}</button>)}</div>}</div>)}
          <div className="category-tabs"><button className={`cat-tab ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>Todos</button>{categories.map(cat => <button key={cat} className={`cat-tab ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>)}</div>
          <div className="products-grid">{filteredProducts.map(product => (<div key={product.id} className={`product-card ${sentToKitchen ? 'disabled' : ''}`} onClick={() => addToOrder(product)}><div className="product-name">{product.isCombo ? '🎉 ' : ''}{product.name}</div><div className="product-price">${delivery && product.delivery_price > 0 ? product.delivery_price?.toFixed(2) : product.price?.toFixed(2)}</div>{product.delivery_price > 0 && <div style={{ fontSize: 9, color: '#f39c12' }}>🛵 ${product.delivery_price?.toFixed(2)}</div>}<div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3 }}>⏱️ {product.preparation_time || 5} min</div></div>))}</div>
        </div>
        <div className="order-panel">
          <div className="order-header"><h3>{delivery ? getPlatformLabel(platform) : '🛍️ Para Llevar'} {folio && '#' + folio}</h3>{sentToKitchen && <span className="badge badge-warning">🍳 En cocina</span>}</div>
          <div style={{ padding: '0 15px' }}>
            {delivery && <div className="form-group"><label>Plataforma</label><select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)} disabled={sentToKitchen}><option value="uber">🛵 Uber Eats</option><option value="didi">🛵 DiDi Food</option><option value="rappi">🛵 Rappi</option></select></div>}
            <div className="form-group"><label>Nombre del cliente *</label><input type="text" className="input" placeholder="Nombre..." value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={sentToKitchen} /></div>
            <div className="form-group"><label>Teléfono</label><input type="text" className="input" placeholder="Teléfono..." value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} disabled={sentToKitchen} /></div>
            {delivery && <div className="form-group"><label>Folio de App *</label><input type="text" className="input" placeholder="# de orden de la app..." value={manualFolio} onChange={(e) => setManualFolio(e.target.value)} disabled={sentToKitchen} /></div>}
          </div>
          <div className="order-items">{orderItems.length === 0 ? <div className="empty-order"><p>🛒 Selecciona productos</p></div> : orderItems.map((item, index) => (<div key={index} className="order-item" style={{ opacity: sentToKitchen ? 0.8 : 1, borderLeft: item.isPromo ? '3px solid #e74c3c' : sentToKitchen ? '3px solid #27ae60' : '3px solid #FF6B35' }}><div className="item-info"><span className="item-name">{item.product_name} {item.isPromo ? '🎁' : sentToKitchen ? '✓' : '🆕'}</span><span className="item-price">${item.price?.toFixed(2)} c/u</span></div>{!sentToKitchen ? (<div className="item-controls"><button onClick={() => updateQuantity(item.product_id, -1)}>➖</button><span className="item-qty">{item.quantity}</span><button onClick={() => updateQuantity(item.product_id, 1)}>➕</button><button onClick={() => removeItem(item.product_id)} className="btn-delete">🗑️</button></div>) : (<div className="item-controls"><span className="item-qty">{item.quantity}x</span></div>)}<div className="item-total">${(item.price * item.quantity).toFixed(2)}</div></div>))}</div>
          <div className="order-footer"><div className="totals">{estimatedTime > 0 && <div className="total-row"><span>⏱️ Tiempo estimado:</span><span style={{ color: '#f39c12', fontWeight: 'bold' }}>{estimatedTime} min</span></div>}{activePromo && <div className="total-row" style={{ color: '#e74c3c' }}><span>🏷️ {activePromo.name}:</span><span>-${(total - finalTotal).toFixed(2)}</span></div>}<div className="total-row grand-total"><span>TOTAL:</span><span>${finalTotal.toFixed(2)}</span></div></div>{!sentToKitchen ? (<button className="btn btn-warning btn-lg btn-full" onClick={handleSendToKitchen} disabled={orderItems.length === 0}>🧾 Enviar a Cocina ({orderItems.length} productos)</button>) : (<div style={{ display: 'flex', gap: 10 }}><button className="btn btn-danger btn-lg" style={{ flex: 1 }} onClick={async () => { if (orderId) { await supabase.from('order_items').delete().eq('order_id', orderId); await supabase.from('orders').delete().eq('id', orderId); } clearOrder(); }}>❌ Cancelar</button><button className="btn btn-success btn-lg" style={{ flex: 1 }} onClick={() => setShowPayment(true)}>💰 Cobrar ${finalTotal.toFixed(2)}</button></div>)}</div></div></div>
      {showPayment && <PaymentModal total={finalTotal} onPay={handlePayment} onClose={() => setShowPayment(false)} />}
    </div>
  );
};

export default TakeoutView;