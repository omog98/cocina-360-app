const addToOrder = async (product) => {
    if (sentToKitchen) return;
    const existing = orderItems.find(item => item.product_id === product.id);
    const finalPrice = product.is_combo 
      ? (delivery && product.combo_delivery_price > 0 ? product.combo_delivery_price : product.combo_price)
      : (delivery && product.delivery_price > 0 ? product.delivery_price : product.price);
    
    if (existing) {
      setOrderItems(orderItems.map(item =>
        item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setOrderItems(prev => [...prev, {
        product_id: product.id, product_name: product.is_combo ? '🎉 ' + product.name : product.name,
        price: finalPrice, quantity: 1, notes: '', preparation_time: product.preparation_time || 5,
        isPromo: false, isCombo: product.is_combo
      }]);

      // Si es combo, agregar componentes a $0
      if (product.is_combo) {
        const { data: items } = await supabase
          .from('combo_items')
          .select('*, products:product_id(name)')
          .eq('combo_id', product.id);
        
        if (items && items.length > 0) {
          for (const item of items) {
            setOrderItems(prev => [...prev, {
              product_id: item.product_id,
              product_name: '  └ ' + item.products?.name,
              price: 0, quantity: item.quantity, notes: '',
              preparation_time: 0, isPromo: false, isComboItem: true
            }]);
          }
        }
      }
    }
    updateTime();
};