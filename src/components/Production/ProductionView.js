import React, { useState, useEffect } from 'react';
import supabase from '../../services/supabaseClient';
import { useApp } from '../../context/AppContext';

const ProductionView = () => {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [productionLog, setProductionLog] = useState([]);
  const { showToast } = useApp();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: prods } = await supabase.from('products').select('*').eq('active', true).order('name');
      const { data: inv } = await supabase.from('inventory').select('*').eq('active', true).order('name');
      const { data: log } = await supabase.from('production_log').select('*, product:product_id(name)').order('created_at', { ascending: false }).limit(20);
      
      setProducts(prods || []);
      setInventory(inv || []);
      setProductionLog(log || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProduce = async () => {
    if (!selectedProduct || quantity < 1) {
      showToast('Selecciona un producto y cantidad', 'error');
      return;
    }

    try {
      // Obtener receta del producto
      const { data: recipes } = await supabase
        .from('recipes')
        .select('*, inventory:inventory_id(name, unit, quantity)')
        .eq('product_id', selectedProduct);

      if (!recipes || recipes.length === 0) {
        showToast('Este producto no tiene receta configurada', 'error');
        return;
      }

      // Verificar stock suficiente
      for (const recipe of recipes) {
        const needed = recipe.quantity * quantity;
        const current = recipe.inventory?.quantity || 0;
        if (current < needed) {
          showToast(`Stock insuficiente de ${recipe.inventory?.name}`, 'error');
          return;
        }
      }

      // Descontar del inventario
      for (const recipe of recipes) {
        const needed = recipe.quantity * quantity;
        const current = recipe.inventory?.quantity || 0;
        
        await supabase
          .from('inventory')
          .update({ quantity: current - needed, updated_at: new Date() })
          .eq('id', recipe.inventory_id);

        await supabase.from('inventory_movements').insert([{
          inventory_id: recipe.inventory_id,
          type: 'salida',
          quantity: needed,
          reason: `Producción: ${quantity}x ${products.find(p => p.id === selectedProduct)?.name}`
        }]);
      }

      // Registrar producción
      await supabase.from('production_log').insert([{
        product_id: selectedProduct,
        quantity: quantity,
        created_at: new Date()
      }]);

      const productName = products.find(p => p.id === selectedProduct)?.name;
      showToast(`✅ Producido: ${quantity}x ${productName}`);
      setQuantity(1);
      loadData();
    } catch (error) {
      console.error(error);
      showToast('Error al producir', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🔄</div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h2>🏭 Producción</h2>
          <p className="view-subtitle">Produce items que descuentan del inventario</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 500, margin: '20px auto', padding: 30 }}>
        <div className="form-group">
          <label>Producto a producir</label>
          <select className="input" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
            <option value="">Seleccionar...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Cantidad</label>
          <input type="number" className="input" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} min="1" />
        </div>

        <button className="btn btn-primary btn-lg btn-full" onClick={handleProduce}>
          🏭 Producir
        </button>
      </div>

      {/* Historial */}
      <div className="table-container" style={{ marginTop: 30 }}>
        <h3 style={{ marginBottom: 15 }}>📋 Últimas producciones</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {productionLog.length === 0 ? (
              <tr><td colSpan="3" className="empty-table">Sin producciones</td></tr>
            ) : (
              productionLog.map(log => (
                <tr key={log.id}>
                  <td>{log.product?.name || 'N/A'}</td>
                  <td>{log.quantity}</td>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductionView;