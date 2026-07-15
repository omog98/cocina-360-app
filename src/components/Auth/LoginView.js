import React, { useState } from 'react';
import supabase from '../../services/supabaseClient';
import './LoginView.css';

const LoginView = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePinInput = (digit) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      
      if (newPin.length === 4) {
        handlePinLogin(newPin);
      }
    }
  };

  const handlePinLogin = async (pinValue) => {
    setLoading(true);
    setError('');

    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('pin', pinValue)
        .eq('active', true);

      if (profileError) {
        console.error('Error:', profileError);
        setError('Error de conexión');
        setPin('');
        setLoading(false);
        return;
      }

      if (!profiles || profiles.length === 0) {
        setError('PIN incorrecto');
        setPin('');
        setLoading(false);
        return;
      }

      const profile = profiles[0];
      
      // Login local sin auth.users
      const fakeUser = {
        id: profile.id,
        email: `${profile.role}@cocina360.com`,
        role: profile.role
      };

      onLogin(fakeUser, profile);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al iniciar');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => { setPin(''); setError(''); };
  const handleDelete = () => { setPin(pin.slice(0, -1)); setError(''); };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🍳</div>
          <h1>COCINA 360°</h1>
          <p className="login-subtitle">Phillis Cheesesteaks</p>
        </div>

        <p className="pin-label">Ingresa tu PIN</p>

        <div className="pin-display">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`}>
              {pin.length > i ? '●' : '○'}
            </div>
          ))}
        </div>

        {error && <div className="login-error">{error}</div>}

        <div className="pin-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} className="pin-key" onClick={() => handlePinInput(num.toString())} disabled={loading}>{num}</button>
          ))}
          <button className="pin-key pin-clear" onClick={handleClear} disabled={loading}>C</button>
          <button className="pin-key" onClick={() => handlePinInput('0')} disabled={loading}>0</button>
          <button className="pin-key pin-delete" onClick={handleDelete} disabled={loading}>⌫</button>
        </div>

        {loading && <p className="loading-text">Verificando...</p>}
      </div>
    </div>
  );
};

export default LoginView;