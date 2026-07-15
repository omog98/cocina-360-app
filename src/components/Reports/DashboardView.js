import React, { useState, useEffect } from 'react';
import supabase from '../../services/supabaseClient';
import { recipeService } from '../../services/recipeService';
import { useApp } from '../../context/AppContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const COLORS = ['#FF6B35', '#004E89', '#27ae60', '#f39c12', '#e74c3c', '#9b59b6', '#3498db', '#1abc9c'];

const DashboardView = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');
  const { showToast } = useApp();

  const [kpis, setKpis] = useState({
    totalSales: 0, totalOrders: 0, avgTicket: 0,
    activeTables: 0, lowStock: 0, totalProducts: 0,
    profit: 0, profitMargin: 0, bestHour: ''
  });
  const [salesByHour, setSalesByHour] = useState([]);
  const [salesByDay, setSalesByDay] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [categorySales, setCategorySales] = useState([]);

  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line
  }, [period]);

  const getDateRange = () => {
    const now = new Date();
    let start = new Date();
    if (period === 'today') start.setHours(0, 0, 0, 0);
    else if (period === 'yesterday') { start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0); }
    else if (period === 'week') start.setDate(start.getDate() - 7);
    else if (period === 'month') start.setMonth(start.getMonth() - 1);
    return { start: start.toISOString(), end: now.toISOString() };
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();

      // KPIs
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'closed')
        .gte('created_at', start)
        .lte('created_at', end);

      const totalSales = orders?.reduce((s, o) => s + (o.total || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
      const estimatedCost = totalSales * 0.35;
      const profit = totalSales - estimatedCost;
      const profitMargin = totalSales > 0 ? (profit / totalSales) * 100 : 0;

      const hourMap = {};
      orders?.forEach(o => {
        const h = new Date(o.created_at).getHours();
        hourMap[h] = (hourMap[h] || 0) + (o.total || 0);
      });
      const bestHourEntry = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0];
      const bestHour = bestHourEntry ? `${bestHourEntry[0]}:00` : '-';

      const { data: tables } = await supabase.from('tables').select('*').eq('status', 'occupied');
      const { data: products } = await supabase.from('products').select('*').eq('active', true);

      // Stock bajo desde recipeService
      let lowStock = 0;
      try {
        const lowStockItems = await recipeService.getLowStock();
        lowStock = lowStockItems?.length || 0;
      } catch (err) {
        console.error('Error al obtener stock bajo:', err);
      }

      setKpis({
        totalSales, totalOrders, avgTicket,
        activeTables: tables?.length || 0,
        lowStock,
        totalProducts: products?.length || 0,
        profit, profitMargin, bestHour
      });

      // Ventas por hora
      const hourSales = {};
      for (let i = 8; i <= 23; i++) hourSales[i] = 0;
      orders?.forEach(o => {
        const h = new Date(o.created_at).getHours();
        hourSales[h] = (hourSales[h] || 0) + (o.total || 0);
      });
      setSalesByHour(Object.entries(hourSales).map(([h, v]) => ({
        hora: `${h}:00`, ventas: Math.round(v * 100) / 100
      })));

      // Ventas por día
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStr = date.toISOString().split('T')[0];
        const dayOrders = orders?.filter(o => o.created_at?.startsWith(dayStr)) || [];
        days.push({
          dia: date.toLocaleDateString('es-MX', { weekday: 'short' }),
          ventas: dayOrders.reduce((s, o) => s + (o.total || 0), 0)
        });
      }
      setSalesByDay(days);

      // Top productos
      const { data: items } = await supabase.from('order_items').select('product_name, quantity, price');
      const productMap = {};
      items?.forEach(item => {
        if (!productMap[item.product_name]) productMap[item.product_name] = { name: item.product_name, cantidad: 0, total: 0 };
        productMap[item.product_name].cantidad += item.quantity || 0;
        productMap[item.product_name].total += (item.price * item.quantity) || 0;
      });
      setTopProducts(Object.values(productMap).sort((a, b) => b.total - a.total).slice(0, 8));

      // Métodos de pago
      const methodMap = {};
      orders?.forEach(o => {
        const m = o.payment_method === 'credit_card' || o.payment_method === 'debit_card' ? 'Tarjeta' :
                  o.payment_method === 'cash' ? 'Efectivo' : o.payment_method === 'transfer' ? 'Transferencia' : 'Otro';
        methodMap[m] = (methodMap[m] || 0) + (o.total || 0);
      });
      setPaymentMethods(Object.entries(methodMap).map(([name, value]) => ({ name, value })));

      // Categorías
      const { data: categories } = await supabase.from('categories').select('id, name');
      const { data: allProducts } = await supabase.from('products').select('id, category_id');
      const catMap = {};
      categories?.forEach(c => { catMap[c.id] = { name: c.name, total: 0 }; });
      items?.forEach(item => {
        const prod = allProducts?.find(p => p.id === item.product_id);
        if (prod && catMap[prod.category_id]) catMap[prod.category_id].total += (item.price * item.quantity) || 0;
      });
      setCategorySales(Object.values(catMap).filter(c => c.total > 0));

    } catch (error) {
      showToast('Error al cargar dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#1a1a1a', border: '1px solid #333', padding: '12px', borderRadius: '8px' }}>
          <p style={{ color: '#fff', margin: 0, fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: '5px 0' }}>
              {entry.name}: {formatMoney(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🔄</div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h2>📊 Dashboard Ejecutivo</h2>
          <p className="view-subtitle">
            {period === 'today' ? 'Hoy' : period === 'yesterday' ? 'Ayer' : period === 'week' ? '7 Días' : '30 Días'}
          </p>
        </div>
        <div className="filter-buttons">
          {['today', 'yesterday', 'week', 'month'].map(p => (
            <button key={p} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPeriod(p)}>
              {p === 'today' ? 'Hoy' : p === 'yesterday' ? 'Ayer' : p === 'week' ? '7 Días' : '30 Días'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="executive-kpis">
        <div className="exec-kpi highlight">
          <span className="exec-kpi-label">Ventas Totales</span>
          <span className="exec-kpi-value">{formatMoney(kpis.totalSales)}</span>
          <span className="exec-kpi-sub">{kpis.totalOrders} órdenes</span>
        </div>
        <div className="exec-kpi">
          <span className="exec-kpi-label">Ticket Promedio</span>
          <span className="exec-kpi-value">{formatMoney(kpis.avgTicket)}</span>
        </div>
        <div className="exec-kpi">
          <span className="exec-kpi-label">Utilidad</span>
          <span className="exec-kpi-value" style={{ color: '#27ae60' }}>{formatMoney(kpis.profit)}</span>
          <span className="exec-kpi-sub">{kpis.profitMargin.toFixed(1)}% margen</span>
        </div>
        <div className="exec-kpi">
          <span className="exec-kpi-label">Hora Pico</span>
          <span className="exec-kpi-value">{kpis.bestHour}</span>
        </div>
        <div className="exec-kpi">
          <span className="exec-kpi-label">Mesas Activas</span>
          <span className="exec-kpi-value">{kpis.activeTables}</span>
        </div>
        <div className="exec-kpi warning">
          <span className="exec-kpi-label">Stock Bajo</span>
          <span className="exec-kpi-value">{kpis.lowStock}</span>
          <span className="exec-kpi-sub">productos</span>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid-2">
        <div className="chart-card">
          <h3>📈 Evolución de Ventas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="dia" stroke="#888" />
              <YAxis stroke="#888" tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ventas" stroke="#FF6B35" fill="#FF6B35" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>⏰ Ventas por Hora</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="hora" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ventas" fill="#004E89" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-grid-3">
        <div className="chart-card">
          <h3>🏆 Top Productos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" stroke="#888" tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="name" stroke="#888" width={120} fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>💳 Métodos de Pago</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={paymentMethods} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">
                {paymentMethods.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>📁 Ventas por Categoría</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categorySales} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="total">
                {categorySales.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;