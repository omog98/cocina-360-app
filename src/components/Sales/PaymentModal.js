import React, { useState } from 'react';

const PaymentModal = ({ total, onPay, onClose }) => {
  const [payments, setPayments] = useState([]);
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [tip, setTip] = useState(0);
  const [change, setChange] = useState(0);

  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - paidTotal;

  const addPayment = (method, amount) => {
    if (amount <= 0) return;
    
    let finalAmount = parseFloat(amount);
    let extraChange = 0;

    // Si es efectivo y paga de más, calcular cambio
    if (method === 'cash' && finalAmount > remaining) {
      extraChange = finalAmount - remaining;
      finalAmount = remaining;
    }

    setPayments([...payments, { method, amount: finalAmount }]);
    if (extraChange > 0) {
      setChange(prev => prev + extraChange);
    }
    
    setCashAmount('');
    setCardAmount('');
    setTransferAmount('');
  };

  const removePayment = (index) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handleFinish = () => {
    onPay(payments, tip);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>💳 Cobrar</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="total-display">
            <span>Total a pagar</span>
            <span className="total-amount">${total.toFixed(2)}</span>
          </div>

          {/* Pagos realizados */}
          {payments.length > 0 && (
            <div style={{ marginBottom: 15 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Pagos:</p>
              {payments.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--medium)', borderRadius: 8, marginBottom: 5, alignItems: 'center' }}>
                  <span>{p.method === 'cash' ? '💵 Efectivo' : p.method === 'card' ? '💳 Tarjeta' : '📱 Transferencia'}</span>
                  <span style={{ fontWeight: 'bold' }}>${p.amount.toFixed(2)}</span>
                  <button onClick={() => removePayment(i)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
              <div style={{ textAlign: 'right', marginTop: 5, fontSize: 14 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Restante: </span>
                <strong style={{ color: remaining > 0 ? '#e74c3c' : '#27ae60' }}>${remaining.toFixed(2)}</strong>
              </div>
            </div>
          )}

          {/* Cambio */}
          {change > 0 && (
            <div style={{ padding: 10, background: 'rgba(39, 174, 96, 0.1)', borderRadius: 8, marginBottom: 15, textAlign: 'center' }}>
              <span style={{ color: '#27ae60' }}>💵 Cambio a devolver: </span>
              <strong style={{ color: '#27ae60', fontSize: 18 }}>${change.toFixed(2)}</strong>
            </div>
          )}

          {remaining > 0 && (
            <>
              <div className="form-group">
                <label>💵 Efectivo</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="number"
                    className="input"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="Monto en efectivo"
                    step="0.01"
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => addPayment('cash', parseFloat(cashAmount))}>
                    Agregar
                  </button>
                </div>
                {parseFloat(cashAmount) > remaining && (
                  <p style={{ color: '#27ae60', fontSize: 12, marginTop: 5 }}>
                    Cambio: ${(parseFloat(cashAmount) - remaining).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>💳 Tarjeta</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="number"
                    className="input"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value)}
                    placeholder="Monto en tarjeta"
                    step="0.01"
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => addPayment('card', parseFloat(cardAmount))}>
                    Agregar
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>📱 Transferencia</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="number"
                    className="input"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Monto en transferencia"
                    step="0.01"
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => addPayment('transfer', parseFloat(transferAmount))}>
                    Agregar
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Propina (OPCIONAL, manual) */}
          {payments.length > 0 && remaining <= 0 && (
            <div className="form-group" style={{ marginTop: 15, padding: 12, background: 'var(--medium)', borderRadius: 8 }}>
              <label style={{ color: '#f39c12', fontWeight: 'bold' }}>💵 ¿Agregar propina? (Opcional)</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  className="input"
                  value={tip}
                  onChange={(e) => setTip(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                  style={{ flex: 1 }}
                />
                <span style={{ color: '#f39c12', fontWeight: 'bold', fontSize: 18 }}>
                  ${tip.toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                {[10, 15, 20].map(pct => (
                  <button 
                    key={pct}
                    className="btn btn-sm btn-secondary"
                    onClick={() => setTip(total * (pct / 100))}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {tip > 0 && (
            <div style={{ textAlign: 'center', marginTop: 10, padding: 10, background: 'rgba(243, 156, 18, 0.1)', borderRadius: 8 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total + Propina: </span>
              <span style={{ fontWeight: 'bold', fontSize: 18, color: '#f39c12' }}>
                ${(total + tip).toFixed(2)}
              </span>
            </div>
          )}

          {payments.length > 0 && remaining <= 0 && (
            <button className="btn btn-success btn-full btn-lg" onClick={handleFinish} style={{ marginTop: 15 }}>
              ✅ Completar Cobro - ${total.toFixed(2)} {tip > 0 ? `+ $${tip.toFixed(2)} propina` : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;