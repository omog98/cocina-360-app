import React, { useState, useEffect } from 'react';
import { recipeService } from '../../services/recipeService';
import { productService } from '../../services/productService';
import { inventoryService } from '../../services/inventoryService';
import { useApp } from '../../context/AppContext';
import RecipeModal from './RecipeModal';

const RecipesView = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const { showToast } = useApp();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
}, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, inventoryData] = await Promise.all([
        productService.getAll(),
        inventoryService.getAll()
      ]);
      setProducts(productsData.filter(p => p.active));
      setInventory(inventoryData.filter(i => i.active));
    } catch (error) {
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async (productId) => {
    try {
      const data = await recipeService.getByProduct(productId);
      setRecipes(data);
    } catch (error) {
      showToast('Error al cargar recetas', 'error');
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    loadRecipes(product.id);
  };

  const handleSave = async (recipe) => {
    try {
      if (selectedRecipe) {
        await recipeService.update(selectedRecipe.id, recipe);
        showToast('Ingrediente actualizado en la receta');
      } else {
        await recipeService.create(recipe);
        showToast('Ingrediente agregado a la receta');
      }
      loadRecipes(selectedProduct.id);
      setModalOpen(false);
      setSelectedRecipe(null);
    } catch (error) {
      showToast('Error al guardar', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este ingrediente de la receta?')) return;
    try {
      await recipeService.delete(id);
      showToast('Ingrediente eliminado de la receta');
      loadRecipes(selectedProduct.id);
    } catch (error) {
      showToast('Error al eliminar', 'error');
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
          <h2>📝 Recetas</h2>
          <p className="view-subtitle">Define los ingredientes de cada producto</p>
        </div>
      </div>

      <div className="recipes-layout">
        {/* Lista de productos */}
        <div className="recipes-sidebar">
          <h3>Productos</h3>
          <div className="product-list">
            {products.map(product => (
              <button
                key={product.id}
                className={`product-item ${selectedProduct?.id === product.id ? 'active' : ''}`}
                onClick={() => handleSelectProduct(product)}
              >
                <span className="product-name">{product.name}</span>
                <span className="product-price">${product.price?.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Receta del producto seleccionado */}
        <div className="recipes-content">
          {selectedProduct ? (
            <>
              <div className="recipe-header">
                <h3>🍽️ {selectedProduct.name}</h3>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setSelectedRecipe(null);
                    setModalOpen(true);
                  }}
                >
                  + Agregar Ingrediente
                </button>
              </div>

              {recipes.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                  <p style={{ fontSize: 40, marginBottom: 10 }}>📋</p>
                  <p>No hay ingredientes en esta receta</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    Agrega ingredientes para definir la receta
                  </p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ingrediente</th>
                      <th>Cantidad</th>
                      <th>Unidad</th>
                      <th>Stock Actual</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipes.map(recipe => (
                      <tr key={recipe.id}>
                        <td>{recipe.inventory?.name || 'Sin nombre'}</td>
                        <td>{recipe.quantity}</td>
                        <td>{recipe.unit || recipe.inventory?.unit || '-'}</td>
                        <td>
                          <span className={`badge ${recipe.inventory?.quantity > recipe.inventory?.min_stock ? 'badge-success' : 'badge-warning'}`}>
                            {recipe.inventory?.quantity || 0} {recipe.inventory?.unit || ''}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedRecipe(recipe);
                              setModalOpen(true);
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(recipe.id)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <p style={{ fontSize: 50, marginBottom: 15 }}>👈</p>
              <p>Selecciona un producto para ver su receta</p>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <RecipeModal
          recipe={selectedRecipe}
          product={selectedProduct}
          inventory={inventory}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setSelectedRecipe(null);
          }}
        />
      )}
    </div>
  );
};

export default RecipesView;