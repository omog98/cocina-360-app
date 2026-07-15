import React, { useState } from 'react';
import supabase from '../../services/supabaseClient';
import { useApp } from '../../context/AppContext';

const ResetView = () => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useApp();

  const resetOrders = async () => {
    if (!window.confirm('⚠️ ¿Eliminar TODAS las órdenes e items? Esta acción no se puede deshacer.')) return;
    
    try {
      setLoading(true);
      await supabase.from('order_items').delete().neq('id', '0');
      await supabase.from('orders').delete().neq('id', '0');
      await supabase.from('tables').update({ status: 'available' }).neq('id', '0');
      showToast('✅ Todas las órdenes eliminadas. Mesas liberadas.');
    } catch (error) {
      showToast('Error al reiniciar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetInventory = async () => {
    if (!window.confirm('⚠️ ¿Eliminar todos los movimientos de inventario?')) return;
    
    try {
      setLoading(true);
      await supabase.from('inventory_movements').delete().neq('id', '0');
      await supabase.from('inventory').update({ quantity: 100, updated_at: new Date() }).neq('id', '0');
      showToast('✅ Inventario reiniciado a 100 unidades');
    } catch (error) {
      showToast('Error al reiniciar inventario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = async () => {
    if (!window.confirm('⚠️⚠️ ¿BORRAR TODO? Órdenes, items, movimientos. Esto NO se puede deshacer.')) return;
    if (!window.confirm('¿SEGURO? Esta es tu última advertencia.')) return;
    
    try {
      setLoading(true);
      await supabase.from('order_items').delete().neq('id', '0');
      await supabase.from('orders').delete().neq('id', '0');
      await supabase.from('inventory_movements').delete().neq('id', '0');
      await supabase.from('tables').update({ status: 'available' }).neq('id', '0');
      await supabase.from('inventory').update({ quantity: 100 }).neq('id', '0');
      showToast('✅ Sistema reiniciado completamente');
    } catch (error) {
      showToast('Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h2>🔄 Reiniciar Sistema</h2>
          <p className="view-subtitle">Limpiar datos de prueba</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 500, margin: '20px auto' }}>
        <p style={{ color: '#e74c3c', marginBottom: 20, textAlign: 'center' }}>
          ⚠️ Estas acciones son permanentes. Solo usar para pruebas.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <button 
            className="btn btn-danger btn-lg btn-full" 
            onClick={resetOrders}
            disabled={loading}
          >
            🗑️ Eliminar Todas las Órdenes
          </button>

          <button 
            className="btn btn-warning btn-lg btn-full" 
            onClick={resetInventory}
            disabled={loading}
          >
            📦 Reiniciar Inventario (100 unidades)
          </button>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 15 }}>
            <button 
              className="btn btn-danger btn-lg btn-full" 
              onClick={resetAll}
              disabled={loading}
              style={{ background: '#c0392b' }}
            >
              ⚠️ REINICIAR TODO EL SISTEMA
            </button>
          </div>
        </div>

        {loading && <p style={{ textAlign: 'center', marginTop: 15 }}>🔄 Procesando...</p>}
      </div>
    </div>
  );
};

export default ResetView;