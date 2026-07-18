import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import supabase from '../../services/supabaseClient';
import ProductModal from './ProductModal';
import { useApp } from '../../context/AppContext';

const ProductsView = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState('');
  const { showToast } = useApp();

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      showToast('Error al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (product, comboItems) => {
    try {
      let savedProduct;
      if (selectedProduct) {
        savedProduct = await productService.update(selectedProduct.id, product);
      } else {
        savedProduct = await productService.create(product);
      }

      const productId = selectedProduct?.id || savedProduct?.id;

      if (product.is_combo && comboItems && comboItems.length > 0 && productId) {
        await supabase.from('combo_items').delete().eq('combo_id', productId);
        for (const item of comboItems) {
          await supabase.from('combo_items').insert([{
            combo_id: productId,
            product_id: item.product_id,
            quantity: item.quantity
          }]);
        }
      }

      showToast(selectedProduct ? 'Producto actualizado' : 'Producto creado');
      loadProducts();
      setModalOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error(error);
      showToast('Error al guardar producto', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar este producto?')) return;
    try {
      await productService.delete(id);
      showToast('Producto desactivado');
      loadProducts();
    } catch (error) {
      showToast('Error al eliminar', 'error');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🔄</div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="view">
      <div className="view-header">
        <h2>📦 Productos</h2>
        <div className="view-actions">
          <input
            type="text"
            className="input"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 300 }}
          />
          <button 
            className="btn btn-primary"
            onClick={() => {
              setSelectedProduct(null);
              setModalOpen(true);
            }}
          >
            + Nuevo Producto
          </button>
        </div>
      </div>

      <div className="table-container" style={{ marginTop: 20 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>SKU</th>
              <th>Categoría</th>
              <th>Precio Base</th>
              <th>Delivery</th>
              <th>Costo</th>
              <th>Tiempo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-table">No se encontraron productos</td>
              </tr>
            ) : (
              filteredProducts.map(product => (
                <tr key={product.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 500 }}>
                        {product.is_combo ? '🎉 ' : ''}{product.name}
                      </span>
                    </div>
                  </td>
                  <td>{product.sku || '-'}</td>
                  <td>
                    <span className="badge badge-primary">
                      {product.categories?.name || 'Sin categoría'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>
                    ${product.is_combo ? product.combo_price?.toFixed(2) : product.price?.toFixed(2)}
                  </td>
                  <td>
                    {product.delivery_price > 0 ? '$' + product.delivery_price.toFixed(2) : 'Precio base'}
                  </td>
                  <td>${product.cost?.toFixed(2) || '0.00'}</td>
                  <td>{product.preparation_time || 10} min</td>
                  <td>
                    <span className={`badge ${product.active ? 'badge-success' : 'badge-danger'}`}>
                      {product.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedProduct(product); setModalOpen(true); }} title="Editar">✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product.id)} title="Desactivar">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <ProductModal
          product={selectedProduct}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setSelectedProduct(null); }}
        />
      )}
    </div>
  );
};

export default ProductsView;