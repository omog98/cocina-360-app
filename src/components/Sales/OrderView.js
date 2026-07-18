import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { salesService } from '../../services/salesService';
import { recipeService } from '../../services/recipeService';
import supabase from '../../services/supabaseClient';
import PaymentModal from './PaymentModal';
import { useApp } from '../../context/AppContext';

const OrderView = ({ table, activeOrder, onClose }) => {
  const [products, setProducts] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [activePromo, setActivePromo] = useState(null);
  const [promos, setPromos] = useState([]);
  const [showPromos, setShowPromos] = useState(false);
  const { showToast } = useApp();

  useEffect(() => {
    loadProducts();
    if (activeOrder) {
      const items = (activeOrder.order_items || []).map(item => ({
        ...item,
        isNew: !item.sent_to_kitchen
      }));
      setOrderItems(items);
      setOrderId(activeOrder.id);
      setCustomerName(activeOrder.customer_name || '');
    }
    // eslint-disable-next-line
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data.filter(p => p.active));
      const cats = [...new Set(data.map(p => p.categories?.name).filter(Boolean))];
      setCategories(cats);
      const now = new Date().toISOString();
      const { data: promosData } = await supabase
        .from('promotions')
        .select('*, product:product_id(name), free_product:free_product_id(name)')
        .eq('active', true)
        .or('applies_to.eq.all,applies_to.eq.dine_in')
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`);
      setPromos(promosData || []);
    } catch (error) {
      showToast('Error al cargar productos', 'error');
    }
  };

  const addToOrder = async (product) => {
    const existing = orderItems.find(item => item.product_id === product.id && !item.isComboItem && item.isNew);
    if (existing) {
      setOrderItems(orderItems.map(item =>
        item.product_id === product.id && !item.isComboItem && item.isNew ? { ...item, quantity: item.quantity + 1 } : item
      ));
      return;
    }

    const price = product.is_combo ? (product.combo_price || product.price) : product.price;
    
    const newItems = [...orderItems, {
      product_id: product.id, product_name: (product.is_combo ? '🎉 ' : '') + product.name,
      price: price, quantity: 1, notes: '', status: 'pending',
      isNew: true, sent_to_kitchen: false, isPromo: false, isCombo: product.is_combo, isComboItem: false
    }];

    if (product.is_combo) {
      const { data: items } = await supabase
        .from('combo_items')
        .select('*, products:product_id(name)')
        .eq('combo_id', product.id);
      
      if (items && items.length > 0) {
        for (const item of items) {
          newItems.push({
            product_id: item.product_id,
            product_name: '  └ ' + (item.products?.name || 'Producto'),
            price: 0, quantity: item.quantity || 1, notes: '', status: 'pending',
            isNew: true, sent_to_kitchen: false, isPromo: false,
            isCombo: false, isComboItem: true, parentComboId: product.id
          });
        }
      }
    }
    
    setOrderItems(newItems);
  };

  const updateQuantity = (productId, delta) => {
    setOrderItems(orderItems.map(item => {
      if (item.product_id === productId && item.isNew && !item.isComboItem) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeItem = (productId) => {
    const itemToRemove = orderItems.find(item => item.product_id === productId && item.isNew && !item.isComboItem);
    if (itemToRemove && itemToRemove.isCombo) {
      setOrderItems(orderItems.filter(item => 
        !(item.isComboItem && item.parentComboId === productId) && item.product_id !== productId
      ));
    } else {
      setOrderItems(orderItems.filter(item => !(item.product_id === productId && item.isNew && !item.isComboItem)));
    }
  };

  const handleApplyPromo = (promo) => {
    if (activePromo) { showToast('Ya hay una promoción aplicada', 'error'); return; }
    if (promo.product_id) {
      const hasProduct = orderItems.find(item => item.product_id === promo.product_id);
      if (!hasProduct) { showToast('Necesitas agregar: ' + (promo.product?.name || 'el producto requerido') + ' primero', 'error'); return; }
    }
    if (promo.type === 'free_product' && promo.free_product_id) {
      const freeProduct = products.find(p => p.id === promo.free_product_id);
      if (freeProduct) {
        setOrderItems(prev => [...prev, {
          product_id: freeProduct.id, product_name: '🎁 ' + freeProduct.name + ' (PROMO)',
          price: 0, quantity: 1, notes: 'Promo: ' + promo.name, status: 'pending',
          isNew: true, sent_to_kitchen: false, isPromo: true, isCombo: false, isComboItem: false
        }]);
        setActivePromo(promo);
        showToast('🎁 ' + freeProduct.name + ' agregado');
      }
    } else if (promo.type === 'buy_one_get_one' && promo.product_id) {
      const product = products.find(p => p.id === promo.product_id);
      if (product) {
        setOrderItems(prev => [...prev,
          { product_id: product.id, product_name: product.name, price: product.price, quantity: 1, notes: '', status: 'pending', isNew: true, sent_to_kitchen: false, isPromo: false, isCombo: false, isComboItem: false },
          { product_id: product.id, product_name: '🎁 ' + product.name + ' (2x1)', price: 0, quantity: 1, notes: 'Promo: ' + promo.name, status: 'pending', isNew: true, sent_to_kitchen: false, isPromo: true, isCombo: false, isComboItem: false }
        ]);
        setActivePromo(promo);
        showToast('🎁 2x1 aplicado');
      }
    } else if (promo.type === 'percentage') {
      setActivePromo(promo); showToast('🏷️ ' + promo.value + '% descuento');
    } else if (promo.type === 'amount_discount') {
      setActivePromo(promo); showToast('💵 $' + promo.value + ' descuento');
    }
  };

  const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let finalTotal = total;
  if (activePromo) {
    if (activePromo.type === 'percentage') finalTotal = total - (total * activePromo.value / 100);
    else if (activePromo.type === 'amount_discount') finalTotal = Math.max(0, total - activePromo.value);
  }

  const newItems = orderItems.filter(item => item.isNew);
  const hasNewItems = newItems.length > 0;

  const handleSendToKitchen = async () => {
    try {
      if (newItems.length === 0) { showToast('No hay productos nuevos', 'error'); return; }
      let newOrderId = null;
      if (!orderId) {
        const order = await salesService.createOrder({
          table_id: table.id, type: 'dine_in',
          customer_name: customerName || 'Mesa ' + table.number,
          subtotal: finalTotal, tax: 0, total: finalTotal,
          status: 'open', payment_status: 'pending'
        });
        newOrderId = order.id; setOrderId(newOrderId);
        for (const item of newItems) {
          const saved = await salesService.addOrderItem({
            order_id: newOrderId, product_id: item.product_id,
            product_name: item.product_name, quantity: item.quantity,
            price: item.price, notes: item.notes || '',
            status: 'pending', sent_to_kitchen: true
          });
          item.id = saved.id; item.sent_to_kitchen = true; item.isNew = false;
        }
        await salesService.updateTableStatus(table.id, 'occupied');
      } else {
        for (const item of newItems) {
          const saved = await salesService.addOrderItem({
            order_id: orderId, product_id: item.product_id,
            product_name: item.product_name, quantity: item.quantity,
            price: item.price, notes: item.notes || '',
            status: 'pending', sent_to_kitchen: true
          });
          item.id = saved.id; item.sent_to_kitchen = true; item.isNew = false;
        }
        await salesService.updateOrderTotal(orderId, finalTotal);
      }
      setOrderItems([...orderItems]);
      const idToDiscount = orderId || newOrderId;
      if (idToDiscount) { try { await recipeService.discountInventory(idToDiscount); } catch (err) { } }
      showToast('🧾 ' + newItems.length + ' producto(s) enviado(s) a cocina');
    } catch (error) { showToast('Error al enviar', 'error'); }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('¿Cancelar esta mesa?')) return;
    try {
      if (orderId) await salesService.deleteOrder(orderId);
      await salesService.updateTableStatus(table.id, 'available');
      showToast('Mesa cancelada'); onClose();
    } catch (error) { showToast('Error al cancelar', 'error'); }
  };

  const handlePayment = async (payments, tip) => {
    try {
      if (!orderId) { showToast('Envía la comanda primero', 'error'); return; }
      const paymentMethods = payments.map(p => p.method).join(' + ');
      await salesService.closeOrder(orderId, { method: paymentMethods, total: finalTotal, tip: tip || 0 });
      if (activePromo) { try { await supabase.from('promotions').update({ times_used: (activePromo.times_used || 0) + 1 }).eq('id', activePromo.id); } catch (err) {} }
      await salesService.updateTableStatus(table.id, 'dirty');
      showToast('✅ Mesa ' + table.number + ' cobrada - $' + finalTotal.toFixed(2));
      setShowPayment(false);

      setTimeout(async () => {
        try {
          const { data: config } = await supabase.from('ticket_config').select('*').limit(1).single();
          const fs = config?.font_size || 12;
          const logoWidth = config?.logo_width || 200;
          const logoHTML = config?.logo_url ? `<div style="text-align:center"><img src="${config.logo_url}" style="width:${logoWidth}px;margin-bottom:15px" /></div>` : '';

          const ticketHTML = `
            <html><head><title>Ticket</title>
                <style>
                    @page { margin: 0; size: 80mm auto; }
                    * { font-weight: bold !important; }
                    body { font-family: 'Arial Black', sans-serif; font-size: ${fs * 1.5}px; width: 300px; margin: 0 auto; padding: 20px; color: #000; line-height: 1.4; }
                    .center { text-align: center; }
                    .line { border-top: 3px solid #000; margin: 12px 0; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { text-align: left; padding: 5px 0; }
                    .right { text-align: right; }
                    .header-name { font-size: ${fs * 2}px !important; margin: 10px 0 !important; }
                    .total-text { font-size: ${fs * 2.2}px !important; margin: 10px 0 !important; }
                </style></head><body>
                ${logoHTML}
                <div class="center"><div class="header-name">${config?.business_name || 'COCINA 360°'}</div>
                ${config?.business_address ? `<div>${config.business_address}</div>` : ''}
                ${config?.business_phone ? `<div>${config.business_phone}</div>` : ''}
                ${config?.rfc ? `<div>RFC: ${config.rfc}</div>` : ''}</div>
                <div class="line"></div>
                <div>Fecha: ${new Date().toLocaleString()}</div>
                <div>Mesa: ${table.number} | ${customerName || 'N/A'}</div>
                <div class="line"></div>
                <table><tr style="border-bottom:2px solid #000"><th>Cant</th><th>Producto</th><th class="right">Total</th></tr>
                ${orderItems.map(item => `<tr><td>${item.quantity}</td><td>${item.product_name}</td><td class="right">$${(item.price * item.quantity).toFixed(2)}</td></tr>`).join('')}
                </table>
                <div class="line"></div>
                <div class="right">Subtotal: $${total.toFixed(2)}</div>
                ${activePromo ? `<div class="right" style="color:#e74c3c">🏷️ ${activePromo.name}: -$${(total - finalTotal).toFixed(2)}</div>` : ''}
                <div class="total-text right">TOTAL: $${finalTotal.toFixed(2)}</div>
                <div class="line"></div>
                <div class="center">${config?.footer_text || '¡GRACIAS POR SU VISITA!'}</div>
                ${config?.show_qr && config?.qr_url ? `<div style="text-align:center;margin-top:15px"><img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(config.qr_url)}" style="width:120px;height:120px" /></div>` : ''}
                <script>setTimeout(function(){window.print()},500);</script>
            </body></html>`;
          const ticketWindow = window.open('', 'Ticket', 'width=300,height=600');
          ticketWindow.document.write(ticketHTML);
        } catch (err) { }
      }, 300);
      onClose();
    } catch (error) { showToast('Error al cobrar', 'error'); }
  };

  const filteredProducts = selectedCategory === 'all' ? products : products.filter(p => p.categories?.name === selectedCategory);

  return (
    <div className="order-layout">
      <div className="order-menu">
        {promos.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <button onClick={() => setShowPromos(!showPromos)} style={{ background: showPromos ? '#FF6B35' : 'var(--medium)', border: 'none', color: 'white', padding: '8px 15px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>🏷️ Promociones ({promos.length})</button>
            {showPromos && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0' }}>{promos.map(promo => <button key={promo.id} onClick={() => handleApplyPromo(promo)} style={{ background: '#e74c3c', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 15, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}>🏷️ {promo.name}</button>)}</div>}
          </div>
        )}
        <div className="category-tabs">
          <button className={`cat-tab ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>Todos</button>
          {categories.map(cat => <button key={cat} className={`cat-tab ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>)}
        </div>
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card" onClick={() => addToOrder(product)}>
              <div className="product-name">{product.is_combo ? '🎉 ' : ''}{product.name}</div>
              <div className="product-price">${product.is_combo ? (product.combo_price || product.price)?.toFixed(2) : product.price?.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="order-panel">
        <div className="order-header"><h3>🪑 Mesa {table.number}</h3>
          <div>{orderId && <span className="badge badge-warning">🍳 Abierta</span>}
            {activePromo && <span className="badge" style={{ background: '#e74c3c', color: 'white', marginLeft: 5, cursor: 'pointer' }} onClick={() => { setActivePromo(null); showToast('Promoción removida'); }}>🏷️ {activePromo.name} ✕</span>}
            <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ marginLeft: 10 }}>✕</button></div></div>
        <div className="form-group" style={{ padding: '0 15px' }}><input type="text" className="input" placeholder="Nombre del cliente..." value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
        <div className="order-items">
          {orderItems.length === 0 ? <div className="empty-order"><p>🛒 Selecciona productos</p></div> : (
            <>
              {orderItems.filter(i => !i.isNew).map((item, index) => (
                <div key={'sent-' + index} className="order-item" style={{ opacity: 0.8, borderLeft: item.isPromo ? '3px solid #e74c3c' : item.isCombo ? '3px solid #f39c12' : '3px solid #27ae60' }}>
                  <div className="item-info"><span className="item-name">{item.product_name} {item.isPromo ? '🎁' : '✓'}</span><span className="item-price">${item.price?.toFixed(2)} c/u</span></div>
                  <div className="item-controls"><span className="item-qty">{item.quantity}x</span></div>
                  <div className="item-total">${(item.price * item.quantity).toFixed(2)}</div></div>
              ))}
              {orderItems.filter(i => i.isNew).map((item, index) => (
                <div key={'new-' + index} className="order-item" style={{ borderLeft: item.isPromo ? '3px solid #e74c3c' : item.isCombo ? '3px solid #f39c12' : '3px solid #FF6B35' }}>
                  <div className="item-info"><span className="item-name">{item.product_name} {item.isPromo ? '🎁' : '🆕'}</span><span className="item-price">${item.price?.toFixed(2)} c/u</span></div>
                  <div className="item-controls">
                    {!item.isComboItem && <><button onClick={() => updateQuantity(item.product_id, -1)}>➖</button><span className="item-qty">{item.quantity}</span><button onClick={() => updateQuantity(item.product_id, 1)}>➕</button></>}
                    {!item.isComboItem && <button onClick={() => removeItem(item.product_id)} className="btn-delete">🗑️</button>}
                    {item.isComboItem && <span className="item-qty">{item.quantity}x</span>}
                  </div>
                  <div className="item-total">${(item.price * item.quantity).toFixed(2)}</div></div>
              ))}
            </>
          )}
        </div>
        <div className="order-footer">
          <div className="totals">{activePromo && <div className="total-row" style={{ color: '#e74c3c' }}><span>🏷️ {activePromo.name}:</span><span>-${(total - finalTotal).toFixed(2)}</span></div>}
            <div className="total-row grand-total"><span>TOTAL:</span><span>${finalTotal.toFixed(2)}</span></div></div>
          {hasNewItems && <button className="btn btn-warning btn-lg btn-full" onClick={handleSendToKitchen} style={{ marginBottom: 8 }}>🧾 Enviar a Cocina ({newItems.length})</button>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-danger btn-lg" style={{ flex: 1 }} onClick={handleCancelOrder}>❌ Cancelar</button>
            <button className="btn btn-success btn-lg" style={{ flex: 1 }} onClick={() => setShowPayment(true)} disabled={orderItems.length === 0}>💰 Cobrar ${finalTotal.toFixed(2)}</button></div></div></div>
      {showPayment && <PaymentModal total={finalTotal} onPay={handlePayment} onClose={() => setShowPayment(false)} />}
    </div>
  );
};

export default OrderView;