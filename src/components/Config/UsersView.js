import React, { useState, useEffect } from 'react';
import supabase from '../../services/supabaseClient';
import { useApp } from '../../context/AppContext';

const UsersView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showPermisos, setShowPermisos] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', role: 'mesero', pin: '' });
  const { showToast } = useApp();

  const allPermissions = [
    { key: 'tables', label: 'Comedor', icon: '🪑' },
    { key: 'takeout', label: 'Para Llevar', icon: '🛍️' },
    { key: 'delivery', label: 'Delivery', icon: '🛵' },
    { key: 'inventory_view', label: 'Ver Inventario', icon: '👁️' },
    { key: 'inventory_restock', label: 'Reestockear', icon: '📥' },
    { key: 'inventory_edit', label: 'Editar Inventario', icon: '✏️' },
    { key: 'inventory_delete', label: 'Eliminar Inventario', icon: '🗑️' },
    { key: 'inventory_movements', label: 'Movimientos Inv.', icon: '📋' },
    { key: 'kitchen', label: 'Cocina KDS', icon: '🍳' },
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'reports', label: 'Reportes', icon: '📋' },
    { key: 'products', label: 'Productos', icon: '📦' },
    { key: 'categories', label: 'Categorías', icon: '📁' },
    { key: 'recipes', label: 'Recetas', icon: '📝' },
    { key: 'combos', label: 'Combos', icon: '🎉' },
    { key: 'promotions', label: 'Promociones', icon: '🏷️' },
    { key: 'company', label: 'Empresa', icon: '🏢' },
    { key: 'production', label: 'Producción', icon: '🏭' },
  ];

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('profiles').select('*').order('role');
      setUsers(data || []);
    } catch (error) {
      showToast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openEditUser = (user) => {
    setEditUser(user);
    setEditForm({
      full_name: user.full_name || '',
      role: user.role || 'mesero',
      pin: user.pin || ''
    });
  };

  const handleUpdateUser = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          role: editForm.role,
          pin: editForm.pin
        })
        .eq('id', editUser.id);

      if (error) throw error;
      showToast('✅ Usuario actualizado');
      setEditUser(null);
      loadUsers();
    } catch (error) {
      showToast('Error al actualizar', 'error');
    }
  };

  const openPermissions = (user) => {
    setEditingUser({ ...user, permissions: user.permissions || {} });
    setShowPermisos(true);
  };

  const togglePermission = (key) => {
    setEditingUser(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] }
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
      setShowPermisos(false);
      loadUsers();
    } catch (error) {
      showToast('Error al guardar permisos', 'error');
    }
  };

  const getRoleBadge = (role) => {
    const colors = { admin: '#e74c3c', gerente: '#f39c12', mesero: '#3498db', cocinero: '#27ae60' };
    return colors[role] || '#888';
  };

  if (loading) {
    return <div className="loading-container"><div className="loading-spinner">🔄</div><p>Cargando usuarios...</p></div>;
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h2>👥 Usuarios</h2>
          <p className="view-subtitle">Administra empleados y permisos</p>
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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="5" className="empty-table">No hay usuarios</td></tr>
            ) : (
              users.map(user => (
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
                    <div className="action-buttons">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditUser(user)} title="Editar">✏️</button>
                      <button className="btn btn-primary btn-sm" onClick={() => openPermissions(user)} title="Permisos">
                        🔑 {Object.values(user.permissions || {}).filter(Boolean).length}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Editar Usuario */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>✏️ Editar Usuario</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditUser(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre completo</label>
                <input type="text" className="input" value={editForm.full_name} onChange={(e) => setEditForm({...editForm, full_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select className="input" value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})}>
                  <option value="admin">Administrador</option>
                  <option value="gerente">Gerente</option>
                  <option value="mesero">Mesero</option>
                  <option value="cocinero">Cocinero</option>
                </select>
              </div>
              <div className="form-group">
                <label>PIN (4 dígitos)</label>
                <input type="text" className="input" value={editForm.pin} onChange={(e) => setEditForm({...editForm, pin: e.target.value.replace(/\D/g, '').slice(0, 4)})} maxLength="4" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleUpdateUser}>💾 Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Permisos */}
      {showPermisos && editingUser && (
        <div className="modal-overlay" onClick={() => setShowPermisos(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div>
                <h3>🔑 Permisos de {editingUser.full_name}</h3>
                <span className="badge" style={{ backgroundColor: getRoleBadge(editingUser.role), color: 'white', fontSize: 11 }}>{editingUser.role}</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPermisos(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: 15, fontSize: 13 }}>Selecciona a qué módulos puede acceder</p>
              <div className="permissions-grid">
                {allPermissions.map(perm => (
                  <label key={perm.key} className="permission-item">
                    <input type="checkbox" checked={editingUser.permissions[perm.key] || false} onChange={() => togglePermission(perm.key)} />
                    <span>{perm.icon}</span>
                    <span>{perm.label}</span>
                  </label>
                ))}
              </div>
              <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
                <button className="btn btn-sm btn-secondary" onClick={() => {
                  const allTrue = {};
                  allPermissions.forEach(p => allTrue[p.key] = true);
                  setEditingUser(prev => ({ ...prev, permissions: allTrue }));
                }}>✅ Todo</button>
                <button className="btn btn-sm btn-secondary" onClick={() => {
                  const allFalse = {};
                  allPermissions.forEach(p => allFalse[p.key] = false);
                  setEditingUser(prev => ({ ...prev, permissions: allFalse }));
                }}>❌ Nada</button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPermisos(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={savePermissions}>💾 Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersView;