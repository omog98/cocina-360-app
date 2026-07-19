import supabase from './supabaseClient';

const TABLE = 'recipes';

export const recipeService = {
  async getByProduct(productId) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*, inventory:inventory_id(name, unit, quantity)')
      .eq('product_id', productId);
    if (error) throw error;
    return data;
  },

  async create(recipe) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([recipe])
      .select();
    if (error) throw error;
    return data[0];
  },

  async update(id, recipe) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(recipe)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  async delete(id) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async discountInventory(orderId) {
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, product_name, quantity')
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;
    if (!items || items.length === 0) return;

    for (const item of items) {
      const { data: recipes, error: recipeError } = await supabase
        .from('recipes')
        .select('inventory_id, quantity')
        .eq('product_id', item.product_id);

      if (recipeError || !recipes || recipes.length === 0) continue;

      for (const recipe of recipes) {
        const totalToDiscount = recipe.quantity * item.quantity;

        const { data: inventory } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('id', recipe.inventory_id)
          .single();

        if (!inventory) continue;

        const newQuantity = Math.max(0, (inventory.quantity || 0) - totalToDiscount);

        await supabase
          .from('inventory')
          .update({ quantity: newQuantity, updated_at: new Date() })
          .eq('id', recipe.inventory_id);

        await supabase
          .from('inventory_movements')
          .insert([{
            inventory_id: recipe.inventory_id,
            type: 'salida',
            quantity: totalToDiscount,
            reason: 'Venta: ' + item.quantity + 'x ' + item.product_name
          }]);
      }
    }
  },

  async getLowStock() {
    const { data: allInventory } = await supabase
      .from('inventory')
      .select('*')
      .eq('active', true);

    if (!allInventory) return [];

    return allInventory.filter(item => {
      return item.quantity <= (item.min_stock || 5);
    });
  }
};