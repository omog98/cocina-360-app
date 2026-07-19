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
    if (!delivery && !folio) generateFolio();
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
        setOrderItems((order.order_items || []).map(item => ({ ...item, isNew: false, sent_to_kitchen: true })));
      } else {
        if (!delivery) generateFolio();
      }
    } catch (error) {
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
      const { data: promosData } = await supabase.from('promotions').select('*, product:product_id(name), free_product:free_product_id(name)').eq('active', true).or('applies_to.eq.all,applies_to.eq.' + orderType).lte('start_date', now).or('end_date.is.null,end_date.gte.' + now);
      setPromos(promosData || []);
    } catch (error) {}
  };

  const generateFolio = async () => { try { const newFolio = await salesService.getNextFolio(); setFolio(String(newFolio || 1)); } catch (error) { setFolio('1'); } };

  const addToOrder = (product) => {
    if (sentToKitchen) return;
    const finalPrice = product.isCombo ? (delivery && product.combo_delivery_price > 0 ? product.combo_delivery_price : (product.combo_price || product.price)) : (delivery && product.delivery_price > 0 ? product.delivery_price : product.price);
    const existing = orderItems.find(item => item.product_id === product.id && item.isNew);
    if (existing) { setOrderItems(orderItems.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item)); }
    else { setOrderItems([...orderItems, { product_id: product.id, product_name: product.name, price: finalPrice, quantity: 1, notes: '', preparation_time: product.preparation_time || 5, isPromo: false, isCombo: product.isCombo, isNew: true }]); }
    updateTime();
  };

  const updateQuantity = (productId, delta) => { if (sentToKitchen) return; setOrderItems(orderItems.map(item => { if (item.product_id === productId) { const newQty = item.quantity + delta; return newQty > 0 ? { ...item, quantity: newQty } : null; } return item; }).filter(Boolean)); updateTime(); };
  const removeItem = (productId) => { if (sentToKitchen) return; setOrderItems(orderItems.filter(item => item.product_id !== productId)); updateTime(); };
  const updateTime = () => { setEstimatedTime(orderItems.reduce((sum, item) => sum + ((item.preparation_time || 5) * item.quantity), 0)); };

  const handleApplyPromo = (promo) => {
    if (activePromo) { showToast('Ya hay una promocion aplicada', 'error'); return; }
    if (promo.product_id && !orderItems.find(item => item.product_id === promo.product_id)) { showToast('Agrega el producto requerido primero', 'error'); return; }
    if (promo.type === 'free_product' && promo.free_product_id) { const freeProduct = products.find(p => p.id === promo.free_product_id); if (freeProduct) { setOrderItems(prev => [...prev, { product_id: freeProduct.id, product_name: '🎁 ' + freeProduct.name, price: 0, quantity: 1, notes: '', preparation_time: freeProduct.preparation_time || 5, isPromo: true, isNew: true }]); setActivePromo(promo); } }
    else { setActivePromo(promo); }
  };

  const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let finalTotal = total;
  if (activePromo) { if (activePromo.type === 'percentage') finalTotal = total - (total * activePromo.value / 100); else if (activePromo.type === 'amount_discount') finalTotal = Math.max(0, total - activePromo.value); }

  const handleSendToKitchen = async () => {
    try {
      if (orderItems.length === 0) { showToast('Agrega productos', 'error'); return; }
      if (!customerName.trim()) { showToast('Ingresa nombre del cliente', 'error'); return; }
      const finalFolio = delivery ? manualFolio : folio;
      const order = await salesService.createOrder({ table_id: null, type: delivery ? 'delivery' : 'takeout', customer_name: customerName, customer_phone: customerPhone, folio: finalFolio, platform: delivery ? platform : null, estimated_time: estimatedTime, subtotal: finalTotal, tax: 0, total: finalTotal, status: 'open', payment_status: 'pending' });
      const newOrderId = order.id; setOrderId(newOrderId);
      for (const item of orderItems) {
        await salesService.addOrderItem({ order_id: newOrderId, product_id: item.product_id, product_name: item.product_name, quantity: item.quantity, price: item.price, notes: item.notes || '', status: 'pending', sent_to_kitchen: true, preparation_time: item.preparation_time || 5 });
        if (item.isCombo) { const { data: comboItems } = await supabase.from('combo_items').select('*, products:product_id(name)').eq('combo_id', item.product_id); if (comboItems) { for (const ci of comboItems) { await salesService.addOrderItem({ order_id: newOrderId, product_id: ci.product_id, product_name: '  - ' + (ci.products?.name || ''), quantity: ci.quantity || 1, price: 0, notes: '', status: 'pending', sent_to_kitchen: true }); } } }
      }
      setSentToKitchen(true); setCancelled(false);
      try { await recipeService.discountInventory(newOrderId); } catch (err) {}
    } catch (error) { showToast('Error', 'error'); }
  };

  const handlePayment = async (payments, tip) => {
    try {
      if (!orderId) return;
      await salesService.closeOrder(orderId, { method: payments.map(p => p.method).join(' + '), total: finalTotal, tip: tip || 0 });
      showToast('Cobrado: $' + finalTotal.toFixed(2));
      
      setTimeout(async () => {
        const { data: config } = await supabase.from('ticket_config').select('*').limit(1).single();
        const { data: allItems } = await supabase.from('order_items').select('*').eq('order_id', orderId);
        const ticketItems = allItems || orderItems;
        
        const tipo = delivery ? (platform === 'uber' ? 'Uber Eats' : platform === 'didi' ? 'DiDi Food' : 'Rappi') : 'Para Llevar';
        const folioMostrar = delivery ? manualFolio : folio;
        
        let qrHTML = '';
        if (config?.show_qr && config?.qr_url) {
          qrHTML = '<div style="text-align:center;margin-top:15px"><img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + encodeURIComponent(config.qr_url) + '" style="width:120px;height:120px" /></div>';
        }
        
        const w = window.open('', 'Ticket', 'width=300,height=600');
        w.document.write(
          '<html><head><title>Ticket</title>' +
          '<style>*{font-weight:bold;font-family:Arial;font-size:14px}body{width:280px;margin:10px auto;padding:10px}.center{text-align:center}.line{border-top:2px solid #000;margin:8px 0}.right{text-align:right}table{width:100%}th,td{text-align:left;padding:3px 0}</style></head><body>' +
          (config?.logo_url ? '<div class="center"><img src="' + config.logo_url + '" style="width:180px;margin-bottom:10px"/></div>' : '') +
          '<div class="center"><h2>' + (config?.business_name || 'COCINA 360') + '</h2>' +
          (config?.business_address ? '<p>' + config.business_address + '</p>' : '') +
          (config?.business_phone ? '<p>Tel: ' + config.business_phone + '</p>' : '') +
          (config?.rfc ? '<p>RFC: ' + config.rfc + '</p>' : '') + '</div><div class="line"></div>' +
          '<p>Fecha: ' + new Date().toLocaleString('es-MX', { timeZone: 'America/Monterrey' }) + '</p>' +
          '<p>' + tipo + ' #' + folioMostrar + '</p>' +
          '<p>Cliente: ' + (customerName || 'N/A') + '</p>' +
          (customerPhone ? '<p>Tel Cliente: ' + customerPhone + '</p>' : '') +
          '<div class="line"></div>' +
          '<table><tr style="border-bottom:2px solid #000"><th>Cant</th><th>Producto</th><th class="right">Total</th></tr>' +
          ticketItems.map(i => '<tr><td>' + i.quantity + '</td><td>' + i.product_name + '</td><td class="right">$' + (i.price * i.quantity).toFixed(2) + '</td></tr>').join('') +
          '</table><div class="line"></div><p class="right">Subtotal: $' + total.toFixed(2) + '</p>' +
          (activePromo ? '<p class="right" style="color:red">' + activePromo.name + ': -$' + (total - finalTotal).toFixed(2) + '</p>' : '') +
          '<p class="right" style="font-size:18px">TOTAL: $' + finalTotal.toFixed(2) + '</p><div class="line"></div>' +
          '<p class="center">' + (config?.footer_text || 'Gracias!') + '</p>' +
          qrHTML +
          '<script>setTimeout(function(){window.print()},500);</script></body></html>'
        );
      }, 300);
      
      clearOrder();
    } catch (error) { showToast('Error al cobrar', 'error'); }
  };

  const clearOrder = () => { setOrderItems([]); setCustomerName(''); setCustomerPhone(''); setSentToKitchen(false); setOrderId(null); setEstimatedTime(0); setShowPayment(false); setActivePromo(null); setCancelled(true); if (!delivery) generateFolio(); if (delivery) setManualFolio(''); };
  const getPlatformLabel = (p) => { return p === 'uber' ? 'Uber Eats' : p === 'didi' ? 'DiDi Food' : 'Rappi'; };
  const getDisplayPrice = (product) => {
    if (product.isCombo) { if (delivery && product.combo_delivery_price > 0) return product.combo_delivery_price; return product.combo_price || product.price; }
    if (delivery && product.delivery_price > 0) return product.delivery_price;
    return product.price;
  };

  const filteredProducts = selectedCategory === 'all' ? products : products.filter(p => p.categories?.name === selectedCategory);
  if (loadingOrder) return <div className="loading-container"><p>Cargando...</p></div>;

  return (
    <div className="view">
      <div className="view-header"><div><h2>{delivery ? 'Delivery' : 'Para Llevar'}</h2><p className="view-subtitle">{delivery ? getPlatformLabel(platform) + ' | Folio manual' : 'Folio #' + folio}</p></div><div>{estimatedTime > 0 && <span className="badge badge-warning">{estimatedTime} min</span>}</div></div>
      <div className="order-layout">
        <div className="order-menu">
          {promos.length > 0 && (<div style={{ marginBottom: 10 }}><button onClick={() => setShowPromos(!showPromos)} style={{ background: showPromos ? '#FF6B35' : 'var(--medium)', border: 'none', color: 'white', padding: '8px 15px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>Promos ({promos.length})</button>{showPromos && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0' }}>{promos.map(promo => <button key={promo.id} onClick={() => handleApplyPromo(promo)} style={{ background: '#e74c3c', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 15, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}>{promo.name}</button>)}</div>}</div>)}
          <div className="category-tabs"><button className={`cat-tab ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>Todos</button>{categories.map(cat => <button key={cat} className={`cat-tab ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>)}</div>
          <div className="products-grid">{filteredProducts.map(product => (<div key={product.id} className={`product-card ${sentToKitchen ? 'disabled' : ''}`} onClick={() => addToOrder(product)}><div className="product-name">{product.isCombo ? '🎉 ' : ''}{product.name}</div><div className="product-price">${getDisplayPrice(product)?.toFixed(2)}</div>{delivery && product.delivery_price > 0 && !product.isCombo && (<div style={{ fontSize: 9, color: '#f39c12' }}>Normal: ${product.price?.toFixed(2)}</div>)}<div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3 }}>⏱️ {product.preparation_time || 5} min</div></div>))}</div>
        </div>
        <div className="order-panel">
          <div className="order-header"><h3>{delivery ? getPlatformLabel(platform) : 'Para Llevar'} {folio && '#' + folio}</h3>{sentToKitchen && <span className="badge badge-warning">En cocina</span>}</div>
          <div style={{ padding: '0 15px' }}>
            {delivery && <div className="form-group"><label>Plataforma</label><select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}><option value="uber">Uber Eats</option><option value="didi">DiDi Food</option><option value="rappi">Rappi</option></select></div>}
            <div className="form-group"><label>Nombre *</label><input type="text" className="input" placeholder="Nombre..." value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={sentToKitchen} /></div>
            <div className="form-group"><label>Telefono</label><input type="text" className="input" placeholder="Telefono..." value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} disabled={sentToKitchen} /></div>
            {delivery && <div className="form-group"><label>Folio App *</label><input type="text" className="input" placeholder="# orden app..." value={manualFolio} onChange={(e) => setManualFolio(e.target.value)} disabled={sentToKitchen} /></div>}
          </div>
          <div className="order-items">{orderItems.length === 0 ? <div className="empty-order"><p>Selecciona productos</p></div> : orderItems.map((item, index) => (<div key={index} className="order-item"><div className="item-info"><span className="item-name">{item.product_name}</span><span className="item-price">${item.price?.toFixed(2)} c/u</span></div><div className="item-controls">{!sentToKitchen ? <><button onClick={() => updateQuantity(item.product_id, -1)}>-</button><span className="item-qty">{item.quantity}</span><button onClick={() => updateQuantity(item.product_id, 1)}>+</button><button onClick={() => removeItem(item.product_id)} className="btn-delete">X</button></> : <span className="item-qty">{item.quantity}x</span>}</div><div className="item-total">${(item.price * item.quantity).toFixed(2)}</div></div>))}</div>
          <div className="order-footer"><div className="totals"><div className="total-row grand-total"><span>TOTAL:</span><span>${finalTotal.toFixed(2)}</span></div></div>{!sentToKitchen ? (<button className="btn btn-warning btn-lg btn-full" onClick={handleSendToKitchen} disabled={orderItems.length === 0}>Enviar a Cocina</button>) : (<div style={{ display: 'flex', gap: 10 }}><button className="btn btn-danger btn-lg" style={{ flex: 1 }} onClick={async () => { if (orderId) { await supabase.from('order_items').delete().eq('order_id', orderId); await supabase.from('orders').delete().eq('id', orderId); } clearOrder(); }}>Cancelar</button><button className="btn btn-success btn-lg" style={{ flex: 1 }} onClick={() => setShowPayment(true)}>Cobrar ${finalTotal.toFixed(2)}</button></div>)}</div></div></div>
      {showPayment && <PaymentModal total={finalTotal} onPay={handlePayment} onClose={() => setShowPayment(false)} />}
    </div>
  );
};

export default TakeoutView;
