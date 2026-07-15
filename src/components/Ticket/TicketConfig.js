import React, { useState, useEffect } from 'react';
import supabase from '../../services/supabaseClient';
import TicketPreview from './TicketPreview';
import { useApp } from '../../context/AppContext';

const TicketConfig = () => {
  const [config, setConfig] = useState({
    logo_url: '',
    logo_width: 200,
    business_name: 'Cocina 360°',
    business_address: '',
    business_phone: '',
    rfc: '',
    footer_text: '¡Gracias por su visita!',
    show_qr: true,
    qr_url: '',
    font_size: 12,
    line_spacing: 4
  });
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(false);
  const { showToast } = useApp();

  useEffect(() => {
    loadConfig();
    // eslint-disable-next-line
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('ticket_config').select('*').limit(1).single();
      if (data) {
        setConfig({
          logo_url: data.logo_url || '',
          logo_width: data.logo_width || 200,
          business_name: data.business_name || 'Cocina 360°',
          business_address: data.business_address || '',
          business_phone: data.business_phone || '',
          rfc: data.rfc || '',
          footer_text: data.footer_text || '¡Gracias por su visita!',
          show_qr: data.show_qr ?? true,
          qr_url: data.qr_url || '',
          font_size: data.font_size || 12,
          line_spacing: data.line_spacing || 4
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { data: existing } = await supabase.from('ticket_config').select('id').limit(1).single();
      if (existing) {
        const { error } = await supabase.from('ticket_config').update({ ...config, updated_at: new Date() }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ticket_config').insert([{ ...config, updated_at: new Date() }]);
        if (error) throw error;
      }
      showToast('✅ Configuración guardada');
    } catch (error) {
      console.error(error);
      showToast('Error al guardar', 'error');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileName = `logo-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('logos').upload(fileName, file);
    if (error) { showToast('Error al subir logo', 'error'); return; }
    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName);
    setConfig({ ...config, logo_url: urlData.publicUrl });
    showToast('✅ Logo subido');
  };

  if (loading) return <div className="loading-container"><div className="loading-spinner">🔄</div><p>Cargando...</p></div>;

  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h2>🧾 Configuración de Tickets</h2>
          <p className="view-subtitle">Personaliza cómo se verán tus tickets</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setPreview(!preview)}>{preview ? 'Ocultar' : '👁️'} Vista Previa</button>
          <button className="btn btn-primary" onClick={handleSave}>💾 Guardar</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: preview ? '1fr 1fr' : '1fr', gap: 20, marginTop: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="form-group">
            <label>Nombre del negocio</label>
            <input type="text" className="input" value={config.business_name} onChange={(e) => setConfig({...config, business_name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Dirección</label>
            <input type="text" className="input" value={config.business_address || ''} onChange={(e) => setConfig({...config, business_address: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input type="text" className="input" value={config.business_phone || ''} onChange={(e) => setConfig({...config, business_phone: e.target.value})} />
          </div>
          <div className="form-group">
            <label>RFC</label>
            <input type="text" className="input" value={config.rfc || ''} onChange={(e) => setConfig({...config, rfc: e.target.value})} placeholder="XXXX000000XXX" />
          </div>
          <div className="form-group">
            <label>Texto del pie</label>
            <input type="text" className="input" value={config.footer_text} onChange={(e) => setConfig({...config, footer_text: e.target.value})} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Tamaño de letra</label>
              <select className="input" value={config.font_size} onChange={(e) => setConfig({...config, font_size: parseInt(e.target.value)})}>
                <option value="8">8 pt</option>
                <option value="10">10 pt</option>
                <option value="12">12 pt</option>
                <option value="14">14 pt</option>
                <option value="16">16 pt</option>
                <option value="18">18 pt</option>
                <option value="20">20 pt</option>
              </select>
            </div>
            <div className="form-group">
              <label>Espaciado</label>
              <select className="input" value={config.line_spacing} onChange={(e) => setConfig({...config, line_spacing: parseInt(e.target.value)})}>
                <option value="2">Compacto</option>
                <option value="4">Normal</option>
                <option value="6">Espaciado</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Logo</label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="input" />
            {config.logo_url && (
              <>
                <img src={config.logo_url} alt="Logo" style={{ maxWidth: 150, marginTop: 10, borderRadius: 8, display: 'block' }} />
                <div className="form-group" style={{ marginTop: 10 }}>
                  <label>Ancho del logo (px)</label>
                  <input type="number" className="input" value={config.logo_width || 200} onChange={(e) => setConfig({...config, logo_width: parseInt(e.target.value) || 200})} style={{ maxWidth: 100 }} />
                </div>
              </>
            )}
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={config.show_qr} onChange={(e) => setConfig({...config, show_qr: e.target.checked})} />
              <span>Mostrar código QR</span>
            </label>
          </div>
          {config.show_qr && (
            <div className="form-group">
              <label>URL del QR</label>
              <input type="text" className="input" value={config.qr_url || ''} onChange={(e) => setConfig({...config, qr_url: e.target.value})} placeholder="https://menu.cocina360.com" />
            </div>
          )}
        </div>
        {preview && <TicketPreview config={config} />}
      </div>
    </div>
  );
};

export default TicketConfig;