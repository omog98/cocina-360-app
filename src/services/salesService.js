import supabase from './supabaseClient';

export const salesService = {
  async getTables() {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('number', { ascending: true });
    if (error) throw error;
    return data;
  },

 async getActiveOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('status', 'open');
    if (error) throw error;
    return data;
},

async deleteOrder(orderId) {
    // Eliminar items primero
    await supabase.from('order_items').delete().eq('order_id', orderId);
    // Eliminar orden
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) throw error;
},

async getNextFolio() {
    const { data, error } = await supabase
      .from('orders')
      .select('folio')
      .eq('type', 'takeout')
      .not('folio', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) return '1';
    
    if (data && data.length > 0 && data[0].folio) {
      const lastNum = parseInt(data[0].folio);
      if (!isNaN(lastNum)) return String(lastNum + 1);
    }
    
    return '1';
},

  async createOrder(order) {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        table_id: order.table_id,
        type: order.type,
        customer_name: order.customer_name,
        subtotal: order.subtotal,
        tax: order.tax || 0,
        total: order.total,
        payment_method: order.payment_method || null,
        status: order.status || 'open',
        payment_status: order.payment_status || 'pending'
      }])
      .select();
    if (error) throw error;
    return data[0];
  },

  async addOrderItem(item) {
    const { data, error } = await supabase
      .from('order_items')
      .insert([{
        order_id: item.order_id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || '',
        status: item.status || 'pending',
        sent_to_kitchen: item.sent_to_kitchen || false
      }])
      .select();
    if (error) throw error;
    return data[0];
  },

  async updateOrderItems(orderId, items, total) {
    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);
    if (deleteError) throw deleteError;
    
    for (const item of items) {
      const { error: insertError } = await supabase
        .from('order_items')
        .insert([{
          order_id: orderId,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || '',
          status: 'pending',
          sent_to_kitchen: item.sent_to_kitchen || false
        }]);
      if (insertError) throw insertError;
    }
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({ total: total, subtotal: total })
      .eq('id', orderId);
    if (updateError) throw updateError;
  },

  async updateOrderTotal(orderId, total) {
    const { error } = await supabase
      .from('orders')
      .update({ total: total, subtotal: total })
      .eq('id', orderId);
    if (error) throw error;
  },

  async closeOrder(orderId, payment) {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'closed',
        payment_method: payment.method,
        payment_status: 'paid',
        total: payment.total,
        tip: payment.tip || 0,
        closed_at: new Date()
      })
      .eq('id', orderId)
      .select();
    if (error) throw error;
    return data[0];
},

async getActiveOrderByType(type) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('type', type)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    return { data };
},

  async updateTableStatus(tableId, status) {
    const { data, error } = await supabase
      .from('tables')
      .update({ status })
      .eq('id', tableId)
      .select();
    if (error) throw error;
    return data[0];
  }
};