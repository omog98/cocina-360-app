import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { salesService } from '../../services/salesService';
import { recipeService } from '../../services/recipeService';
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
  const { showToast } = useApp();

  useEffect(() => {
    loadProducts();
    loadActiveOrder();
    // eslint-disable-next-line
  }, []);

  const loadActiveOrder = async () => {
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
        
        const items = (order.order_items || []).map(item => ({
          ...item,
          isNew: false,
          sent_to_kitchen: true
        }));
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
      setProducts(data.filter(p => p.active));
      const cats = [...new Set(data.map(p => p.categories?.name).filter(Boolean))];
      setCategories(cats);
    } catch (error) {
      showToast('Error al cargar productos', 'error');
    }
  };

  const generateFolio = async () => {
    try {
      const data = await salesService.getNextFolio();
      setFolio(String(data || 1));
    } catch (error) {
      setFolio('1');
    }
  };

  const addToOrder = (product) => {
    if (sentToKitchen) return;
    const existing = orderItems.find(item => item.product_id === product.id);
    if (existing) {
      setOrderItems(orderItems.map(item =>
        item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setOrderItems([...orderItems, {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1,
        notes: '',
        preparation_time: product.preparation_time || 5
      }]);
    }
    updateTime();
  };

  const updateQuantity = (productId, delta) => {
    if (sentToKitchen) return;
    setOrderItems(orderItems.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
    updateTime();
  };

  const removeItem = (productId) => {
    if (sentToKitchen) return;
    setOrderItems(orderItems.filter(item => item.product_id !== productId));
    updateTime();
  };

  const updateTime = () => {
    const totalTime = orderItems.reduce((sum, item) => {
      return sum + ((item.preparation_time || 5) * item.quantity);
    }, 0);
    setEstimatedTime(totalTime);
  };

  const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSendToKitchen = async () => {
    try {
      if (orderItems.length === 0) {
        showToast('Agrega productos primero', 'error');
        return;
      }
      if (!customerName.trim()) {
        showToast('Ingresa el nombre del cliente', 'error');
        return;
      }

      const finalFolio = delivery ? manualFolio : folio;

      const order = await salesService.createOrder({
        table_id: null,
        type: delivery ? 'delivery' : 'takeout',
        customer_name: customerName,
        customer_phone: customerPhone,
        folio: finalFolio,
        estimated_time: estimatedTime,
        subtotal: total,
        tax: 0,
        total: total,
        status: 'open',
        payment_status: 'pending'
      });

      const newOrderId = order.id;
      setOrderId(newOrderId);

      for (const item of orderItems) {
        await salesService.addOrderItem({
          order_id: newOrderId,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || '',
          status: 'pending',
          sent_to_kitchen: true,
          preparation_time: item.preparation_time || 5
        });
      }

      setSentToKitchen(true);

      try {
        await recipeService.discountInventory(newOrderId);
      } catch (err) {
        console.error('Error al descontar inventario:', err);
      }

      showToast(`🧾 Pedido #${finalFolio} enviado a cocina. ⏱️ ${estimatedTime} min`);
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al enviar a cocina', 'error');
    }
  };

  const handlePayment = async (payments, tip) => {
    try {
      if (!orderId) {
        showToast('Primero envía a cocina', 'error');
        return;
      }
      const paymentMethods = payments.map(p => p.method).join(' + ');
      await salesService.closeOrder(orderId, {
        method: paymentMethods,
        total: total,
        tip: tip || 0
      });
      showToast(`✅ Pedido cobrado - $${total.toFixed(2)} ${tip > 0 ? '+ Propina: $' + tip.toFixed(2) : ''}`);
      clearOrder();
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al cobrar', 'error');
    }
  };

  const clearOrder = () => {
    setOrderItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setSentToKitchen(false);
    setOrderId(null);
    setEstimatedTime(0);
    setShowPayment(false);
    if (!delivery) generateFolio();
    if (delivery) setManualFolio('');
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.categories?.name === selectedCategory);

  if (loadingOrder) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🔄</div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h2>{delivery ? '🛵 Delivery' : '🛍️ Para Llevar'}</h2>
          <p className="view-subtitle">
            {delivery ? 'Uber Eats / DiDi Food / Rappi' : `Folio #${folio}`}
          </p>
        </div>
        <div>
          {estimatedTime > 0 && (
            <span className="badge badge-warning" style={{ fontSize: 14, padding: '8px 15px' }}>
              ⏱️ {estimatedTime} min
            </span>
          )}
        </div>
      </div>

      <div className="order-layout">
        <div className="order-menu">
          <div className="category-tabs">
            <button className={`cat-tab ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>Todos</button>
            {categories.map(cat => (
              <button key={cat} className={`cat-tab ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
            ))}
          </div>
          <div className="products-grid">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                className={`product-card ${sentToKitchen ? 'disabled' : ''}`}
                onClick={() => addToOrder(product)}
              >
                <div className="product-name">{product.name}</div>
                <div className="product-price">${product.price?.toFixed(2)}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3 }}>
                  ⏱️ {product.preparation_time || 5} min
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-panel">
          <div className="order-header">
            <h3>{delivery ? '🛵 Delivery' : '🛍️ Para Llevar'} {folio && `#${folio}`}</h3>
            {sentToKitchen && <span className="badge badge-warning">🍳 En cocina</span>}
          </div>

          <div style={{ padding: '0 15px' }}>
            <div className="form-group">
              <label>Nombre del cliente *</label>
              <input type="text" className="input" placeholder="Nombre..." value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={sentToKitchen} />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input type="text" className="input" placeholder="Teléfono..." value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} disabled={sentToKitchen} />
            </div>
            {delivery && (
              <div className="form-group">
                <label>Folio de App *</label>
                <input type="text" className="input" placeholder="# de orden de la app..." value={manualFolio} onChange={(e) => setManualFolio(e.target.value)} disabled={sentToKitchen} />
              </div>
            )}
          </div>

          <div className="order-items">
            {orderItems.length === 0 ? (
              <div className="empty-order"><p>🛒 Selecciona productos</p></div>
            ) : (
              orderItems.map((item, index) => (
                <div key={index} className="order-item" style={{ opacity: sentToKitchen ? 0.8 : 1, borderLeft: sentToKitchen ? '3px solid #27ae60' : '3px solid #FF6B35' }}>
                  <div className="item-info">
                    <span className="item-name">{item.product_name} {sentToKitchen ? '✓' : '🆕'}</span>
                    <span className="item-price">${item.price?.toFixed(2)} c/u</span>
                  </div>
                  {!sentToKitchen ? (
                    <div className="item-controls">
                      <button onClick={() => updateQuantity(item.product_id, -1)}>➖</button>
                      <span className="item-qty">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product_id, 1)}>➕</button>
                      <button onClick={() => removeItem(item.product_id)} className="btn-delete">🗑️</button>
                    </div>
                  ) : (
                    <div className="item-controls">
                      <span className="item-qty">{item.quantity}x</span>
                    </div>
                  )}
                  <div className="item-total">${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))
            )}
          </div>

          <div className="order-footer">
            <div className="totals">
              {estimatedTime > 0 && (
                <div className="total-row">
                  <span>⏱️ Tiempo estimado:</span>
                  <span style={{ color: '#f39c12', fontWeight: 'bold' }}>{estimatedTime} min</span>
                </div>
              )}
              <div className="total-row grand-total">
                <span>TOTAL:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {!sentToKitchen ? (
              <button className="btn btn-warning btn-lg btn-full" onClick={handleSendToKitchen} disabled={orderItems.length === 0}>
                🧾 Enviar a Cocina ({orderItems.length} productos)
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-danger btn-lg" style={{ flex: 1 }} onClick={clearOrder}>❌ Cancelar</button>
                <button className="btn btn-success btn-lg" style={{ flex: 1 }} onClick={() => setShowPayment(true)}>💰 Cobrar ${total.toFixed(2)}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentModal total={total} onPay={handlePayment} onClose={() => setShowPayment(false)} />
      )}
    </div>
  );
};

export default TakeoutView;