import React, { useState, useEffect } from 'react';
import supabase from '../../services/supabaseClient';

const ReportsView = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    supabase.from('orders').select('*').eq('status', 'closed').order('created_at', { ascending: false }).then(({ data }) => setOrders(data || []));
  }, []);

  return (
    <div className="view" style={{ padding: 20 }}>
      <h2>📋 TEST REPORTES</h2>
      <p>Órdenes encontradas: <strong>{orders.length}</strong></p>
      {orders.map(o => (
        <div key={o.id} style={{ background: '#1a1a1a', padding: 10, margin: 5, borderRadius: 5, display: 'flex', justifyContent: 'space-between' }}>
          <span>{o.customer_name || 'N/A'} - {o.type} - ${o.total?.toFixed(2)}</span>
          <button onClick={async () => {
            if (window.confirm('Borrar?')) {
              await supabase.from('order_items').delete().eq('order_id', o.id);
              await supabase.from('orders').delete().eq('id', o.id);
              window.location.reload();
            }
          }} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 15px', cursor: 'pointer', borderRadius: 5 }}>🗑️ BORRAR</button>
        </div>
      ))}
    </div>
  );
};

export default ReportsView;