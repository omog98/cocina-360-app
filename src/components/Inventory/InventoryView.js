import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';
import InventoryModal from './InventoryModal';
import InventoryMovements from './InventoryMovements';
import AccessDenied from '../Common/AccessDenied';
import { useApp } from '../../context/AppContext';

const InventoryView = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [movementsOpen, setMovementsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { showToast } = useApp();

  const permissions = user?.permissions || {};
  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || permissions.inventory_edit;
  const canDelete = isAdmin || permissions.inventory_delete;
  const canRestock = isAdmin || permissions.inventory_restock;
  const canAddMovements = isAdmin || permissions.inventory_movements;
  const canView = isAdmin || permissions.inventory_view;

  useEffect(() => {
    if (canView) loadInventory();
    else setLoading(false);
    // eslint-disable-next-line
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getAll();
      setItems(data);
    } catch (error) {
      showToast('Error al cargar inventario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (item) => {
    if (!canEdit) { showToast('No tienes permiso', 'error'); return; }
    try {
      if (selectedItem) {
        await inventoryService.update(selectedItem.id, item);
        showToast('Ingrediente actualizado');
      } else {
        await inventoryService.create(item);
        showToast('Ingrediente creado');
      }
      loadInventory();
      setModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      showToast('Error al guardar', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) { showToast('No tienes permiso', 'error'); return; }
    if (!window.confirm('¿Desactivar este ingrediente?')) return;
    try {
      await inventoryService.delete(id);
      showToast('Ingrediente desactivado');
      loadInventory();
    } catch (error) {
      showToast('Error al eliminar', 'error');
    }
  };

  const handleMovement = async (movement) => {
    if (!canAddMovements) { showToast('No tienes permiso', 'error'); return; }
    try {
      await inventoryService.addMovement(movement);
      showToast('Movimiento registrado');
      loadInventory();
    } catch (error) {
      showToast('Error al registrar movimiento', 'error');
    }
  };

  if (!canView) {
    return <AccessDenied />;
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                         item.supplier?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'low_stock') return matchesSearch && item.quantity <= item.min_stock && item.active;
    if (filter === 'inactive') return matchesSearch && !item.active;
    return matchesSearch && item.active;
  });

  const lowStockCount = items.filter(i => i.quantity <= i.min_stock && i.active).length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🔄</div>
        <p>Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h2>📦 Inventario</h2>
          <p className="view-subtitle">
            {canEdit ? 'Gestión completa' : canRestock ? 'Puedes reestockear' : 'Solo lectura'}
          </p>
        </div>
        <div className="view-actions">
          {lowStockCount > 0 && (
            <button className="btn btn-warning" onClick={() => setFilter('low_stock')}>
              ⚠️ {lowStockCount} bajos
            </button>
          )}
          {canEdit && (
            <button className="btn btn-primary" onClick={() => { setSelectedItem(null); setModalOpen(true); }}>
              + Nuevo Ingrediente
            </button>
          )}
        </div>
      </div>

      <div className="filters-bar">
        <input type="text" className="input" placeholder="🔍 Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 400 }} />
        <div className="filter-buttons">
          <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('all')}>Todos</button>
          <button className={`btn btn-sm ${filter === 'low_stock' ? 'btn-warning' : 'btn-secondary'}`} onClick={() => setFilter('low_stock')}>Stock Bajo</button>
          <button className={`btn btn-sm ${filter === 'inactive' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('inactive')}>Inactivos</button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ingrediente</th>
              <th>Unidad</th>
              <th>Existencia</th>
              <th>Stock Mínimo</th>
              <th>Costo</th>
              <th>Proveedor</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr><td colSpan="8" className="empty-table">No se encontraron ingredientes</td></tr>
            ) : (
              filteredItems.map(item => {
                const isLowStock = item.quantity <= item.min_stock;
                return (
                  <tr key={item.id} className={isLowStock ? 'row-warning' : ''}>
                    <td><span className="item-name">{item.name}</span></td>
                    <td>{item.unit}</td>
                    <td><span className={`stock-value ${isLowStock ? 'text-warning' : ''}`}>{item.quantity}</span></td>
                    <td>{item.min_stock}</td>
                    <td>${item.avg_cost?.toFixed(2) || '0.00'}</td>
                    <td>{item.supplier || '-'}</td>
                    <td><span className={`badge ${item.active ? 'badge-success' : 'badge-danger'}`}>{item.active ? 'Activo' : 'Inactivo'}</span></td>
                    <td>
                      <div className="action-buttons">
                        {canRestock && (
                          <button className="btn btn-warning btn-sm" onClick={() => { setSelectedItem(item); setMovementsOpen(true); }} title="Reestock">📥</button>
                        )}
                        {canAddMovements && (
                          <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedItem(item); setMovementsOpen(true); }} title="Movimientos">📋</button>
                        )}
                        {canEdit && (
                          <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedItem(item); setModalOpen(true); }} title="Editar">✏️</button>
                        )}
                        {canDelete && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)} title="Desactivar">🗑️</button>
                        )}
                        {!canEdit && !canRestock && !canDelete && !canAddMovements && (
                          <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Solo lectura</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <InventoryModal item={selectedItem} onSave={handleSave} onClose={() => { setModalOpen(false); setSelectedItem(null); }} />
      )}

      {movementsOpen && selectedItem && (
        <InventoryMovements item={selectedItem} onAddMovement={handleMovement} onClose={() => { setMovementsOpen(false); setSelectedItem(null); }} />
      )}
    </div>
  );
};

export default InventoryView;