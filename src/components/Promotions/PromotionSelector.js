import React, { useState, useEffect } from 'react';
import supabase from '../../services/supabaseClient';

const PromotionSelector = ({ orderType, onApplyPromo }) => {
  const [promotions, setPromotions] = useState([]);
  const [showPromos, setShowPromos] = useState(false);

  useEffect(() => {
    loadPromotions();
    // eslint-disable-next-line
  }, []);

  const loadPromotions = async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('promotions')
      .select('*, product:product_id(name), free_product:free_product_id(name)')
      .eq('active', true)
      .or(`applies_to.eq.all,applies_to.eq.${orderType}`)
      .lte('start_date', now)
      .or(`end_date.is.null,end_date.gte.${now}`);

    setPromotions(data || []);
  };

  const getPromoLabel = (promo) => {
    switch(promo.type) {
      case 'percentage': return `${promo.value}% DESC`;
      case 'buy_one_get_one': return '2x1';
      case 'free_product': return `+ ${promo.free_product?.name || 'GRATIS'}`;
      case 'amount_discount': return `-$${promo.value}`;
      default: return promo.name;
    }
  };

  if (promotions.length === 0) return null;

  return (
    <div style={{ marginBottom: 10 }}>
      <button 
        onClick={() => setShowPromos(!showPromos)}
        style={{
          background: showPromos ? '#FF6B35' : 'var(--medium)',
          border: 'none',
          color: 'white',
          padding: '8px 15px',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: 13,
          marginBottom: showPromos ? 8 : 0
        }}
      >
        🏷️ Promociones ({promotions.length})
      </button>

      {showPromos && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0' }}>
          {promotions.map(promo => (
            <button
              key={promo.id}
              onClick={() => onApplyPromo(promo)}
              style={{
                background: '#e74c3c',
                border: 'none',
                color: 'white',
                padding: '6px 12px',
                borderRadius: 15,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 'bold'
              }}
              title={promo.name}
            >
              🏷️ {promo.product?.name ? `${promo.product.name}: ` : ''}{getPromoLabel(promo)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromotionSelector;