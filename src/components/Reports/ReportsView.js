import React, { useState, useEffect } from 'react';
import supabase from '../../services/supabaseClient';
import { useApp } from '../../context/AppContext';

const ReportsView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const { showToast } = useApp();

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line
  }, [filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select('*')
        .eq('status', 'closed')
        .order('created_at', { ascending: false });

      if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('created_at', today);
      } else if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      }

      const { data } = await query;
      setOrders(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('¿Eliminar esta orden permanentemente?')) return;
    try {
      await supabase.from('order_items').delete().eq('order_id', orderId);
      await supabase.from('orders').delete().eq('id', orderId);
      showToast('✅ Orden eliminada');
      loadOrders();
    } catch (error) {
      showToast('Error al eliminar', 'error');
    }
  };

  const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const cashOrders = orders.filter(o => o.payment_method === 'cash').length;
  const cardOrders = orders.filter(o => o.payment_method === 'credit_card' || o.payment_method === 'debit_card').length;

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

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

      {/* Resumen */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card" style={{ borderTopColor: '#27ae60' }}>
          <div className="kpi-info"><span className="kpi-label">Total Ventas</span><span className="kpi-value">{formatMoney(totalSales)}</span></div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#3498db' }}>
          <div className="kpi-info"><span className="kpi-label">Órdenes</span><span className="kpi-value">{orders.length}</span></div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#f39c12' }}>
          <div className="kpi-info"><span className="kpi-label">Efectivo</span><span className="kpi-value">{cashOrders}</span></div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: '#9b59b6' }}>
          <div className="kpi-info"><span className="kpi-label">Tarjeta</span><span className="kpi-value">{cardOrders}</span></div>
        </div>
      </div>

      {/* Tabla de órdenes */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Plataforma</th>
              <th>Pago</th>
              <th>Total</th>
              <th>Propina</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="empty-table">Cargando...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="9" className="empty-table">No hay órdenes cobradas</td></tr>
            ) : (
              orders.map((order, index) => (
                <tr key={order.id}>
                  <td>{orders.length - index}</td>
                  <td>{order.customer_name || '-'}</td>
                  <td><span className="badge badge-primary">{order.type === 'dine_in' ? '🪑 Comedor' : order.type === 'takeout' ? '🛍️ Llevar' : '🛵 Delivery'}</span></td>
                  <td>{order.platform || '-'}</td>
                  <td><span className="badge badge-success">{order.payment_method}</span></td>
                  <td style={{ fontWeight: 'bold' }}>{formatMoney(order.total)}</td>
                  <td style={{ color: '#f39c12' }}>{order.tip > 0 ? formatMoney(order.tip) : '-'}</td>
                  <td style={{ fontSize: 12 }}>{new Date(order.created_at).toLocaleString('es-MX', { timeZone: 'America/Monterrey' })}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteOrder(order.id)} title="Eliminar">🗑️</button>
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