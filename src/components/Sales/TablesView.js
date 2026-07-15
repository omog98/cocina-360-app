import React, { useState, useEffect } from 'react';
import { salesService } from '../../services/salesService';
import OrderView from './OrderView';
import { useApp } from '../../context/AppContext';

const TablesView = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState({});
  const [showOrder, setShowOrder] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const { showToast } = useApp();

  useEffect(() => {
    loadTables();
    // eslint-disable-next-line
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      const [tablesData, ordersData] = await Promise.all([
        salesService.getTables(),
        salesService.getActiveOrders()
      ]);
      
      setTables(tablesData);
      
      // Mapear órdenes por mesa
      const orderMap = {};
      ordersData?.forEach(o => {
        if (o.table_id) orderMap[o.table_id] = o;
      });
      setActiveOrders(orderMap);
    } catch (error) {
      showToast('Error al cargar mesas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getTableColor = (status) => {
    switch(status) {
      case 'available': return '#27ae60';
      case 'occupied': return '#e74c3c';
      case 'reserved': return '#f39c12';
      case 'dirty': return '#9b59b6';
      default: return '#555';
    }
  };

  const getTableStatus = (status) => {
    switch(status) {
      case 'available': return 'Disponible';
      case 'occupied': return 'Ocupada';
      case 'reserved': return 'Reservada';
      case 'dirty': return 'Sucia';
      default: return status;
    }
  };

  const handleTableClick = (table) => {
    const activeOrder = activeOrders[table.id] || null;
    setSelectedTable({ ...table, activeOrder });
    setShowOrder(true);
  };

  const handleRightClick = async (table, e) => {
    e.preventDefault();
    
    const options = [
      { key: '1', label: 'Disponible', status: 'available' },
      { key: '2', label: 'Reservada', status: 'reserved' },
      { key: '3', label: 'Sucia', status: 'dirty' }
    ];
    
    const message = `Mesa ${table.number} - ${getTableStatus(table.status)}\n\n` +
      options.map(o => `${o.key}. ${o.label}`).join('\n') +
      `\n\nElige una opción:`;
    
    const choice = window.prompt(message);
    const selected = options.find(o => o.key === choice);
    
    if (selected) {
      await salesService.updateTableStatus(table.id, selected.status);
      showToast(`Mesa ${table.number}: ${selected.label}`);
      loadTables();
    }
  };

  const handleCloseOrder = () => {
    setShowOrder(false);
    setSelectedTable(null);
    loadTables();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🔄</div>
        <p>Cargando comedor...</p>
      </div>
    );
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h2>🪑 Comedor</h2>
          <p className="view-subtitle">Clic para abrir mesa | Clic derecho para cambiar estado</p>
        </div>
        <div className="legend">
          <span className="legend-item">
            <span className="legend-color" style={{backgroundColor: '#27ae60'}}></span>
            Disponible
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{backgroundColor: '#e74c3c'}}></span>
            Ocupada
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{backgroundColor: '#f39c12'}}></span>
            Reservada
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{backgroundColor: '#9b59b6'}}></span>
            Sucia
          </span>
        </div>
      </div>

      {showOrder && selectedTable ? (
        <OrderView 
          table={selectedTable}
          activeOrder={selectedTable.activeOrder}
          onClose={handleCloseOrder} 
        />
      ) : (
        <div className="tables-grid">
          {tables.map(table => (
            <div
              key={table.id}
              className="table-card"
              style={{ borderTopColor: getTableColor(table.status) }}
              onClick={() => handleTableClick(table)}
              onContextMenu={(e) => handleRightClick(table, e)}
            >
              <div className="table-number">Mesa {table.number}</div>
              <div className="table-seats">🪑 {table.capacity} asientos</div>
              {activeOrders[table.id] && (
                <div style={{ fontSize: 11, color: '#f39c12', marginTop: 5 }}>
                  🍳 ${activeOrders[table.id].total?.toFixed(2)}
                </div>
              )}
              <div 
                className="table-status"
                style={{ backgroundColor: getTableColor(table.status) }}
              >
                {getTableStatus(table.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TablesView;