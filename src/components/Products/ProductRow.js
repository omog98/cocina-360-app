import React from 'react';

const ProductRow = ({ product, onEdit, onDelete }) => {
  return (
    <tr>
      <td>
        <div className="product-name">
          {product.image_url && (
            <img src={product.image_url} alt={product.name} className="product-thumb" />
          )}
          <span>{product.name}</span>
        </div>
      </td>
      <td>{product.sku || '-'}</td>
      <td>
        <span className="badge badge-primary">
          {product.categories?.name || 'Sin categoría'}
        </span>
      </td>
      <td>${product.price?.toFixed(2)}</td>
      <td>${product.cost?.toFixed(2)}</td>
      <td>
        <span className={`badge ${product.active ? 'badge-success' : 'badge-danger'}`}>
          {product.active ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td>
        <button className="btn btn-secondary btn-sm" onClick={onEdit}>
          ✏️
        </button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>
          🗑️
        </button>
      </td>
    </tr>
  );
};

export default ProductRow;