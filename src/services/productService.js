import supabase from './supabaseClient';

const TABLE = 'products';

export const productService = {
  async getAll() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*, categories(name)')
      .order('order', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*, categories(name)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(product) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([product])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async update(id, product) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(product)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },
  async delete(id) {
    // Primero borrar combo_items si es combo
    await supabase.from('combo_items').delete().eq('combo_id', id);
    
    // Luego borrar el producto
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
},

  async getByCategory(categoryId) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('category_id', categoryId)
      .eq('active', true);
    
    if (error) throw error;
    return data;
  }
};