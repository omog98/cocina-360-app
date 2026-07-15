import React, { useState, useEffect } from 'react';
import { categoryService } from '../../services/categoryService';
import CategoryModal from './CategoryModal';
import { useApp } from '../../context/AppContext';
import './Categories.css';

const CategoriesView = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { showToast } = useApp();

  // Cargar categorías al iniciar
 useEffect(() => {
    loadCategories();
    // eslint-disable-next-line
}, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      showToast('Error al cargar categorías', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Guardar categoría (crear o actualizar)
  const handleSave = async (category) => {
    try {
      if (selectedCategory) {
        await categoryService.update(selectedCategory.id, category);
        showToast('Categoría actualizada');
      } else {
        await categoryService.create(category);
        showToast('Categoría creada');
      }
      loadCategories();
      setModalOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      showToast('Error al guardar categoría', 'error');
    }
  };

  // Desactivar categoría
  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar esta categoría?')) return;
    try {
      await categoryService.delete(id);
      showToast('Categoría desactivada');
      loadCategories();
    } catch (error) {
      showToast('Error al eliminar', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🔄</div>
        <p>Cargando categorías...</p>
      </div>
    );
  }

  return (
    <div className="view">
      {/* Encabezado */}
      <div className="view-header">
        <div>
          <h2>📁 Categorías</h2>
          <p className="view-subtitle">Organiza tus productos por categorías</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setSelectedCategory(null);
            setModalOpen(true);
          }}
        >
          + Nueva Categoría
        </button>
      </div>

      {/* Grid de categorías */}
      <div className="categories-grid">
        {categories.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40, gridColumn: '1/-1' }}>
            <p style={{ fontSize: 40, marginBottom: 10 }}>📁</p>
            <p>No hay categorías creadas</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Crea tu primera categoría para organizar tus productos
            </p>
          </div>
        ) : (
          categories.map(category => (
            <div 
              key={category.id} 
              className="category-card"
              style={{ borderLeftColor: category.color }}
            >
              <div className="category-info">
                <div 
                  className="category-color" 
                  style={{ backgroundColor: category.color }}
                />
                <div>
                  <h3>{category.name}</h3>
                  <span className={`badge ${category.active ? 'badge-success' : 'badge-danger'}`}>
                    {category.active ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className="category-order">Orden: {category.order}</span>
                </div>
              </div>
              <div className="category-actions">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSelectedCategory(category);
                    setModalOpen(true);
                  }}
                  title="Editar"
                >
                  ✏️
                </button>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(category.id)}
                  title="Desactivar"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para crear/editar */}
      {modalOpen && (
        <CategoryModal
          category={selectedCategory}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setSelectedCategory(null);
          }}
        />
      )}
    </div>
  );
};

export default CategoriesView;