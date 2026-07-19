import React, { useState, useEffect } from 'react';
import supabase from '../../services/supabaseClient';
import { useApp } from '../../context/AppContext';

const ReportsView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { showToast } = useApp();

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line
}, [filter]);

  const loadOrders = async () => {
    setLoading(true);
    let query = supabase.from('orders').select('*').eq('status', 'closed').order('created_at', { ascending: false });

    if (filter === 'today') {
      query = query.gte('created_at', new Date().toISOString().split('T')[0]);
    } else if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte('created_at', weekAgo.toISOString());
    }

    const { data } = await query;
    setOrders(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar esta orden?')) return;
    await supabase.from('order_items').delete().eq('order_id', id);
    await supabase.from('orders').delete().eq('id', id);
    showToast('Orden eliminada');
    loadOrders();
  };

  const totalSales = orders.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h2>📋 Reportes</h2>
          <p className="view-subtitle">Historial de ventas cobradas</p>
        </div>
        <div className="filter-buttons">
          <button className={`btn btn-sm ${filter === 'today' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('today')}>Hoy</button>
          <button className={`btn btn-sm ${filter === 'week' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('week')}>Semana</button>
          <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('all')}>Todas</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card" style={{ borderTopColor: '#27ae60' }}>
          <div className="kpi-info"><span className="kpi-label">Total Ventas</span><span className="kpi-value">${totalSales.toFixed(2)}</span></div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#3498db' }}>
          <div className="kpi-info"><span className="kpi-label">Ordenes</span><span className="kpi-value">{orders.length}</span></div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Pago</th>
              <th>Total</th>
              <th>Propina</th>
              <th>Fecha</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="empty-table">Cargando...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="8" className="empty-table">No hay ordenes</td></tr>
            ) : (
              orders.map((order, i) => (
                <tr key={order.id}>
                  <td>{orders.length - i}</td>
                  <td>{order.customer_name || '-'}</td>
                  <td><span className="badge badge-primary">{order.type === 'dine_in' ? 'Comedor' : order.type === 'takeout' ? 'Llevar' : 'Delivery'}</span></td>
                  <td><span className="badge badge-success">{order.payment_method || '-'}</span></td>
                  <td style={{ fontWeight: 'bold' }}>${order.total?.toFixed(2)}</td>
                  <td style={{ color: '#f39c12' }}>{order.tip > 0 ? '$' + order.tip.toFixed(2) : '-'}</td>
                  <td style={{ fontSize: 11 }}>{new Date(order.created_at).toLocaleString('es-MX', { timeZone: 'America/Monterrey' })}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(order.id)}>🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsView;