import React, { useState, useEffect } from 'react';
import supabase from '../../services/supabaseClient';

const KitchenView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  const loadOrders = async () => {
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .in('status', ['open'])
        .order('created_at', { ascending: true })
        .limit(30);
      setOrders(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateItemStatus = async (itemId, newStatus) => {
    try {
      const updates = { status: newStatus };
      if (newStatus === 'preparing') updates.started_at = new Date();
      if (newStatus === 'ready') updates.ready_at = new Date();

      const { error } = await supabase
        .from('order_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;
      loadOrders();
    } catch (error) {
      console.error(error);
    }
  };

  const getElapsedTime = (startedAt) => {
    if (!startedAt) return null;
    const elapsed = Math.floor((now - new Date(startedAt)) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimeElapsed = (createdAt) => {
    const minutes = Math.floor((now - new Date(createdAt)) / 60000);
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const getEstimatedTime = (order) => {
    // Si la orden ya tiene estimated_time válido, usarlo
    if (order.estimated_time && order.estimated_time > 0 && order.estimated_time < 500) {
      return order.estimated_time;
    }
    
    // Calcular desde los items
    const total = order.order_items?.reduce((sum, item) => {
      const prepTime = item.preparation_time || 10;
      const qty = item.quantity || 1;
      return sum + (prepTime * qty);
    }, 0) || 10;
    
    return Math.min(total, 120); // Máximo 120 minutos
};

  const getRemainingTime = (order) => {
    const estimated = getEstimatedTime(order);
    const elapsed = Math.floor((now - new Date(order.created_at)) / 60000);
    const remaining = estimated - elapsed;
    if (remaining <= 0) return 'LISTO ⚠️';
    return `${remaining} min`;
  };

  const handleMarkReady = (orderId) => {
    if (window.confirm('¿Marcar todos los items como LISTOS?')) {
      const order = orders.find(o => o.id === orderId);
      order?.order_items?.forEach(item => {
        if (item.status !== 'ready' && item.status !== 'served') {
          updateItemStatus(item.id, 'ready');
        }
      });
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#0a0a0a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 60 }}>🍳</div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: 20, color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ color: '#FF6B35', fontSize: 28 }}>🍳 COCINA - KDS</h1>
        <div style={{ color: '#888', fontSize: 14 }}>
          {now.toLocaleTimeString()} | {orders.length} órdenes
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 15 }}>
        {orders.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#888' }}>
            <div style={{ fontSize: 50 }}>🍳</div>
            <p style={{ fontSize: 18 }}>No hay órdenes pendientes</p>
          </div>
        )}

        {orders.map(order => {
          const allReady = order.order_items?.every(i => i.status === 'ready' || i.status === 'served');
          const hasPreparing = order.order_items?.some(i => i.status === 'preparing');
          const borderColor = allReady ? '#27ae60' : hasPreparing ? '#e74c3c' : '#f39c12';

          return (
            <div key={order.id} style={{
              background: '#1a1a1a',
              border: `2px solid ${borderColor}`,
              borderRadius: 12,
              overflow: 'hidden'
            }}>
              <div style={{
                background: borderColor, padding: '12px 15px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#000'
              }}>
                <div>
                  <strong style={{ fontSize: 16 }}>
                    {order.type === 'dine_in' ? '🪑 ' + (order.customer_name || 'Mesa') :
                     order.type === 'takeout' ? '🛍️ #' + (order.folio || '?') :
                     '🛵 #' + (order.folio || '?')}
                  </strong>
                </div>
                <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 'bold' }}>
                  ⏱️ {getTimeElapsed(order.created_at)}
                </div>
              </div>

              <div style={{
                padding: '8px 15px', background: 'rgba(255,255,255,0.03)',
                display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #222'
              }}>
                <span style={{ color: '#888' }}>Est: {getEstimatedTime(order)} min</span>
                <span style={{ color: getRemainingTime(order).includes('LISTO') ? '#e74c3c' : '#f39c12', fontWeight: 'bold' }}>
                  {getRemainingTime(order)}
                </span>
              </div>

              <div style={{ padding: '5px 15px' }}>
                {order.order_items?.map((item) => (
                  <div key={item.id} style={{
                    padding: '12px 0', borderBottom: '1px solid #222',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 500 }}>
                        {item.quantity}x {item.product_name}
                      </div>
                      {item.status === 'preparing' && item.started_at && (
                        <div style={{ fontSize: 12, color: '#e74c3c', marginTop: 3 }}>
                          ⏱️ {getElapsedTime(item.started_at)}
                        </div>
                      )}
                      {item.status === 'ready' && (
                        <div style={{ fontSize: 12, color: '#27ae60', marginTop: 3 }}>✓ Listo</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 5 }}>
                      {item.status === 'pending' && (
                        <button onClick={() => updateItemStatus(item.id, 'preparing')}
                          style={{ background: '#e74c3c', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}>
                          ▶ Iniciar
                        </button>
                      )}
                      {item.status === 'preparing' && (
                        <button onClick={() => updateItemStatus(item.id, 'ready')}
                          style={{ background: '#27ae60', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}>
                          ✓ Listo
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!allReady && (
                <div style={{ padding: '10px 15px', borderTop: '1px solid #222' }}>
                  <button onClick={() => handleMarkReady(order.id)}
                    style={{ width: '100%', background: '#27ae60', border: 'none', color: 'white', padding: '10px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
                    ✅ MARCAR TODO LISTO
                  </button>
                </div>
              )}

              {allReady && (
                <div style={{ padding: '10px 15px', borderTop: '1px solid #222', textAlign: 'center', background: 'rgba(39,174,96,0.1)' }}>
                  <span style={{ color: '#27ae60', fontWeight: 'bold', fontSize: 14 }}>🎉 ORDEN COMPLETA</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KitchenView;