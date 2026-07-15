import supabase from './supabaseClient';

const TABLE = 'categories';

export const categoryService = {
  async getAll() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('order', { ascending: true });
    
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

  async create(category) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([category])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async update(id, category) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(category)
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
  }
};