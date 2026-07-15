import supabase from './supabaseClient';

const TABLE = 'inventory';
const MOVEMENTS = 'inventory_movements';

export const inventoryService = {
  async getAll() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(item) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([item])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async update(id, item) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(item)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async delete(id) {
    const { error } = await supabase
      .from(TABLE)
      .update({ active: false })
      .eq('id', id);
    
    if (error) throw error;
  },

  async addMovement(movement) {
    // Registrar movimiento
    const { data: movData, error: movError } = await supabase
      .from(MOVEMENTS)
      .insert([movement])
      .select();
    
    if (movError) throw movError;

    // Actualizar cantidad en inventario
    const { data: item } = await supabase
      .from(TABLE)
      .select('quantity')
      .eq('id', movement.inventory_id)
      .single();

    let newQuantity = parseFloat(item.quantity) || 0;
    if (movement.type === 'entrada') {
      newQuantity += parseFloat(movement.quantity);
    } else if (movement.type === 'salida' || movement.type === 'merma' || movement.type === 'ajuste') {
      newQuantity -= parseFloat(movement.quantity);
    }

    const { error: updateError } = await supabase
      .from(TABLE)
      .update({ quantity: newQuantity, updated_at: new Date() })
      .eq('id', movement.inventory_id);
    
    if (updateError) throw updateError;

    return movData[0];
  },

  async getMovements(inventoryId) {
    const { data, error } = await supabase
      .from(MOVEMENTS)
      .select('*')
      .eq('inventory_id', inventoryId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};