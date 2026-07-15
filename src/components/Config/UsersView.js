import React, { useState, useEffect } from 'react';
import supabase from '../../services/supabaseClient';
import { useApp } from '../../context/AppContext';

const UsersView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { showToast } = useApp();

  const allPermissions = [
    { key: 'tables', label: 'Salón', icon: '🪑' },
    { key: 'takeout', label: 'Para Llevar', icon: '🛍️' },
    { key: 'delivery', label: 'Uber/DiDi', icon: '🛵' },
    { key: 'inventory', label: 'Inventario', icon: '📦' },
    { key: 'kitchen', label: 'Cocina KDS', icon: '🍳' },
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'reports', label: 'Reportes', icon: '📋' },
    { key: 'products', label: 'Productos', icon: '📦' },
    { key: 'categories', label: 'Categorías', icon: '📁' },
    { key: 'recipes', label: 'Recetas', icon: '📝' },
    { key: 'company', label: 'Empresa', icon: '🏢' },
    { key: 'users', label: 'Usuarios', icon: '👥' },
    { key: 'branches', label: 'Sucursales', icon: '🏪' },
    { key: 'inventory_view', label: 'Ver inventario', icon: '👁️' },
    { key: 'inventory_restock', label: 'Reestockear', icon: '📥' },
    { key: 'inventory_edit', label: 'Editar ingredientes', icon: '✏️' },
    { key: 'inventory_delete', label: 'Eliminar ingredientes', icon: '🗑️' },
    { key: 'inventory_movements', label: 'Registrar movimientos', icon: '📋' },
  ];

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line
}, []);
const inventoryPermissions = [
    { key: 'inventory_view', label: 'Ver inventario', icon: '👁️' },
    { key: 'inventory_restock', label: 'Reestockear', icon: '📥' },
    { key: 'inventory_edit', label: 'Editar ingredientes', icon: '✏️' },
    { key: 'inventory_delete', label: 'Eliminar ingredientes', icon: '🗑️' },
    { key: 'inventory_movements', label: 'Registrar movimientos', icon: '📋' },
];

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true });
      setUsers(data || []);
    } catch (error) {
      showToast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openPermissions = (user) => {
    setEditingUser({
      ...user,
      permissions: user.permissions || {}
    });
    setShowModal(true);
  };

  const togglePermission = (key) => {
    setEditingUser(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const savePermissions = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ permissions: editingUser.permissions })
        .eq('id', editingUser.id);

      if (error) throw error;

      showToast(`Permisos de ${editingUser.full_name} actualizados`);
      setShowModal(false);
      loadUsers();
    } catch (error) {
      showToast('Error al guardar permisos', 'error');
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: '#e74c3c',
      gerente: '#f39c12',
      mesero: '#3498db',
      cocinero: '#27ae60'
    };
    return colors[role] || '#888';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🔄</div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h2>👥 Gestión de Usuarios</h2>
          <p className="view-subtitle">Administra permisos por empleado</p>
        </div>
      </div>

      <div className="table-container" style={{ marginTop: 20 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Rol</th>
              <th>PIN</th>
              <th>Estado</th>
              <th>Permisos</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={{ fontWeight: 500 }}>{user.full_name}</td>
                <td>
                  <span className="badge" style={{ backgroundColor: getRoleBadge(user.role), color: 'white' }}>
                    {user.role}
                  </span>
                </td>
                <td>{user.pin}</td>
                <td>
                  <span className={`badge ${user.active ? 'badge-success' : 'badge-danger'}`}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => openPermissions(user)}
                  >
                    🔑 {Object.values(user.permissions || {}).filter(Boolean).length} permisos
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Permisos */}
      {showModal && editingUser && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div>
                <h3>🔑 Permisos de {editingUser.full_name}</h3>
                <span className="badge" style={{ backgroundColor: getRoleBadge(editingUser.role), color: 'white', fontSize: 11 }}>
                  {editingUser.role}
                </span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: 15, fontSize: 13 }}>
                Selecciona a qué módulos puede acceder este usuario
              </p>

              <div className="permissions-grid">
                {allPermissions.map(perm => (
                  <label 
                    key={perm.key} 
                    className="permission-item"
                    style={{
                      opacity: editingUser.role === 'admin' && ['company', 'users', 'branches'].includes(perm.key) ? 0.5 : 1
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={editingUser.permissions[perm.key] || false}
                      onChange={() => togglePermission(perm.key)}
                      disabled={editingUser.role === 'admin' && ['company', 'users', 'branches'].includes(perm.key)}
                    />
                    <span>{perm.icon}</span>
                    <span>{perm.label}</span>
                  </label>
                ))}
              </div>

              {/* Acciones rápidas */}
              <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    const allTrue = {};
                    allPermissions.forEach(p => allTrue[p.key] = true);
                    setEditingUser(prev => ({ ...prev, permissions: allTrue }));
                  }}
                >
                  ✅ Todo
                </button>
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    const allFalse = {};
                    allPermissions.forEach(p => allFalse[p.key] = false);
                    setEditingUser(prev => ({ ...prev, permissions: allFalse }));
                  }}
                >
                  ❌ Nada
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={savePermissions}>💾 Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersView;