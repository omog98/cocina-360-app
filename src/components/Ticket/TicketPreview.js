import React from 'react';

const TicketPreview = ({ config, order, total }) => {
  const fs = config?.font_size || 12;

  const sampleItems = order?.order_items || [
    { product_name: 'Hamburguesa Clasica', quantity: 2, price: 12.99 },
    { product_name: 'Refresco', quantity: 1, price: 2.99 },
    { product_name: '🎁 Refresco (2x1)', quantity: 1, price: 0 },
  ];

  const subtotal = order?.subtotal || 28.97;
  const finalTotal = total || subtotal;
  const logoWidth = config?.logo_width || 180;

  return (
    <div className="card" style={{ padding: 20, display: 'flex', justifyContent: 'center' }}>
      <div style={{
        background: '#fff', color: '#000', padding: 20, width: 300,
        fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 'bold',
        fontSize: fs + 'pt', lineHeight: 1.3, borderRadius: 4,
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)', margin: '0 auto'
      }}>
        {config?.logo_url && (
          <div style={{ textAlign: 'center' }}>
            <img src={config.logo_url} alt="Logo" style={{ width: logoWidth, marginBottom: 15 }} />
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: (fs + 4) + 'pt', margin: '8px 0' }}>{config?.business_name || 'COCINA 360'}</div>
          {config?.business_address && <div style={{ fontSize: fs + 'pt', margin: '3px 0' }}>{config.business_address}</div>}
          {config?.business_phone && <div style={{ fontSize: fs + 'pt', margin: '3px 0' }}>{config.business_phone}</div>}
          {config?.rfc && <div style={{ fontSize: fs + 'pt', margin: '3px 0' }}>RFC: {config.rfc}</div>}
        </div>

        <div style={{ borderTop: '3px solid #000', margin: '10px 0' }} />

        <div style={{ fontSize: fs + 'pt', margin: '5px 0' }}>Fecha: {new Date().toLocaleString()}</div>
        <div style={{ fontSize: fs + 'pt', margin: '5px 0' }}>Mesa: 5 | Cliente: Ejemplo</div>

        <div style={{ borderTop: '3px solid #000', margin: '10px 0' }} />

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #000' }}>
              <th style={{ textAlign: 'left', padding: '4px 0', fontSize: fs + 'pt' }}>Cant</th>
              <th style={{ textAlign: 'left', padding: '4px 0', fontSize: fs + 'pt' }}>Producto</th>
              <th style={{ textAlign: 'right', padding: '4px 0', fontSize: fs + 'pt' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sampleItems.map((item, i) => (
              <tr key={i}>
                <td style={{ padding: '4px 0', fontSize: fs + 'pt' }}>{item.quantity}</td>
                <td style={{ padding: '4px 0', fontSize: fs + 'pt' }}>{item.product_name}</td>
                <td style={{ textAlign: 'right', padding: '4px 0', fontSize: fs + 'pt' }}>${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: '3px solid #000', margin: '10px 0' }} />

        <div style={{ fontSize: fs + 'pt', margin: '5px 0', textAlign: 'right' }}>Subtotal: ${subtotal.toFixed(2)}</div>
        <div style={{ fontSize: (fs + 6) + 'pt', margin: '8px 0', textAlign: 'right' }}>TOTAL: ${finalTotal.toFixed(2)}</div>

        <div style={{ borderTop: '3px solid #000', margin: '10px 0' }} />

        <div style={{ textAlign: 'center', fontSize: fs + 'pt', margin: '8px 0' }}>
          {config?.footer_text || 'GRACIAS POR SU VISITA'}
        </div>

        {config?.show_qr && config?.qr_url && (
          <div style={{ textAlign: 'center', marginTop: 15 }}>
            <img 
              src={'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + encodeURIComponent(config.qr_url)}
              alt="QR" style={{ width: 120, height: 120 }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketPreview;