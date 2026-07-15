import React, { useState, useEffect } from 'react';
import supabase from '../../services/supabaseClient';
import PromotionModal from './PromotionModal';
import { useApp } from '../../context/AppContext';

const PromotionsView = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const { showToast } = useApp();

 useEffect(() => {
    loadPromotions();
    // eslint-disable-next-line
}, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('promotions')
        .select('*, product:product_id(name), free_product:free_product_id(name)')
        .order('created_at', { ascending: false });
      setPromotions(data || []);
    } catch (error) {
      showToast('Error al cargar promociones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (promotion) => {
    try {
      if (selectedPromotion) {
        const { error } = await supabase
          .from('promotions')
          .update(promotion)
          .eq('id', selectedPromotion.id);
        if (error) throw error;
        showToast('Promoción actualizada');
      } else {
        const { error } = await supabase
          .from('promotions')
          .insert([promotion]);
        if (error) throw error;
        showToast('Promoción creada');
      }
      loadPromotions();
      setModalOpen(false);
      setSelectedPromotion(null);
    } catch (error) {
      console.error(error);
      showToast('Error al guardar: ' + error.message, 'error');
    }
};

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta promoción?')) return;
    try {
      await supabase.from('promotions').delete().eq('id', id);
      showToast('Promoción eliminada');
      loadPromotions();
    } catch (error) {
      showToast('Error al eliminar', 'error');
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'percentage': return { label: '% Descuento', icon: '🔢' };
      case 'buy_one_get_one': return { label: '2x1', icon: '🎁' };
      case 'free_product': return { label: 'Producto Gratis', icon: '🆓' };
      case 'amount_discount': return { label: 'Descuento $', icon: '💵' };
      default: return { label: type, icon: '🏷️' };
    }
  };

  const getAppliesTo = (applies) => {
    switch(applies) {
      case 'all': return 'Todos';
      case 'dine_in': return '🪑 Comedor';
      case 'takeout': return '🛍️ Para Llevar';
      case 'delivery': return '🛵 Delivery';
      default: return applies;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🔄</div>
        <p>Cargando promociones...</p>
      </div>
    );
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h2>🏷️ Promociones</h2>
          <p className="view-subtitle">Configura descuentos y ofertas especiales</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setSelectedPromotion(null); setModalOpen(true); }}>
          + Nueva Promoción
        </button>
      </div>

      <div className="table-container" style={{ marginTop: 20 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Producto</th>
              <th>Aplica en</th>
              <th>Vigencia</th>
              <th>Usos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {promotions.length === 0 ? (
              <tr><td colSpan="9" className="empty-table">No hay promociones</td></tr>
            ) : (
              promotions.map(promo => {
                const typeInfo = getTypeLabel(promo.type);
                return (
                  <tr key={promo.id}>
                    <td style={{ fontWeight: 500 }}>{promo.name}</td>
                    <td>
                      <span className="badge" style={{ background: '#FF6B35', color: 'white' }}>
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                    </td>
                    <td>
                      {promo.type === 'percentage' && `${promo.value}%`}
                      {promo.type === 'amount_discount' && `$${promo.value}`}
                      {promo.type === 'buy_one_get_one' && '2x1'}
                      {promo.type === 'free_product' && promo.free_product?.name}
                    </td>
                    <td>{promo.product?.name || 'Todos'}</td>
                    <td><span className="badge badge-primary">{getAppliesTo(promo.applies_to)}</span></td>
                    <td style={{ fontSize: 12 }}>
                      {promo.start_date ? new Date(promo.start_date).toLocaleDateString() : 'Inicio'} - 
                      {promo.end_date ? new Date(promo.end_date).toLocaleDateString() : 'Sin fin'}
                    </td>
                    <td>{promo.times_used || 0}/{promo.usage_limit || '∞'}</td>
                    <td>
                      <span className={`badge ${promo.active ? 'badge-success' : 'badge-danger'}`}>
                        {promo.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedPromotion(promo); setModalOpen(true); }}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(promo.id)}>🗑️</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <PromotionModal
          promotion={selectedPromotion}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setSelectedPromotion(null); }}
        />
      )}
    </div>
  );
};

export default PromotionsView;