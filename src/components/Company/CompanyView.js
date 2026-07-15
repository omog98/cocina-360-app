import React, { useState, useEffect } from 'react';
import supabase from '../../services/supabaseClient';
import { useApp } from '../../context/AppContext';

const CompanyView = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('checkin');
  const [checkinPin, setCheckinPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [selectedForCheckin, setSelectedForCheckin] = useState(null);
  const { showToast } = useApp();

  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: profiles } = await supabase.from('profiles').select('*').order('full_name');
      setEmployees(profiles || []);

      const today = new Date().toISOString().split('T')[0];
      const { data: att } = await supabase
        .from('attendance')
        .select('*')
        .gte('check_in', today)
        .order('check_in', { ascending: false });
      setAttendance(att || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async (profileId) => {
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('profile_id', profileId)
      .order('day_of_week');
    setSchedules(data || []);
  };

  const verifyPinAndCheckIn = async () => {
    if (checkinPin.length !== 4) {
      showToast('Ingresa un PIN de 4 dígitos', 'error');
      return;
    }

    const emp = employees.find(e => e.pin === checkinPin);
    if (!emp) {
      showToast('PIN incorrecto', 'error');
      setCheckinPin('');
      return;
    }

    try {
      const { data: active } = await supabase
        .from('attendance')
        .select('*')
        .eq('profile_id', emp.id)
        .eq('status', 'active')
        .single();

      if (active) {
        // Hacer Check Out
        const checkOut = new Date();
        const checkIn = new Date(active.check_in);
        const hoursWorked = (checkOut - checkIn) / (1000 * 60 * 60);
        let overtime = hoursWorked > 8 ? hoursWorked - 8 : 0;

        await supabase
          .from('attendance')
          .update({
            check_out: checkOut,
            hours_worked: Math.round(hoursWorked * 100) / 100,
            overtime: Math.round(overtime * 100) / 100,
            status: 'completed'
          })
          .eq('id', active.id);

        showToast(`🔴 Check Out - ${emp.full_name} - ${hoursWorked.toFixed(2)} hrs`);
      } else {
        // Hacer Check In
        await supabase
          .from('attendance')
          .insert([{
            profile_id: emp.id,
            check_in: new Date(),
            status: 'active'
          }]);

        showToast(`✅ Check In - ${emp.full_name} - ${new Date().toLocaleTimeString()}`);
      }

      setCheckinPin('');
      setShowPinInput(false);
      loadData();
    } catch (error) {
      console.error(error);
      showToast('Error al registrar', 'error');
    }
  };

  const saveSchedule = async (profileId, day, start, end) => {
    try {
      const { data: existing } = await supabase
        .from('schedules')
        .select('id')
        .eq('profile_id', profileId)
        .eq('day_of_week', day)
        .single();

      if (existing) {
        await supabase
          .from('schedules')
          .update({ start_time: start, end_time: end })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('schedules')
          .insert([{ profile_id: profileId, day_of_week: day, start_time: start, end_time: end }]);
      }

      showToast('✅ Horario guardado');
      loadSchedules(profileId);
    } catch (error) {
      showToast('Error al guardar', 'error');
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
          <h2>🏢 Empresa</h2>
          <p className="view-subtitle">Control de asistencia y horarios</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 5, marginTop: 20, marginBottom: 20 }}>
        <button className={`btn ${tab === 'checkin' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('checkin')}>✅ Check In/Out</button>
        <button className={`btn ${tab === 'schedules' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('schedules')}>📅 Horarios</button>
        <button className={`btn ${tab === 'history' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('history')}>📋 Historial</button>
      </div>

      {tab === 'checkin' && (
        <div>
          {/* Check In con PIN */}
          <div className="card" style={{ maxWidth: 400, margin: '0 auto 30px auto', textAlign: 'center', padding: 30 }}>
            <h3 style={{ marginBottom: 20 }}>Registrar Entrada/Salida</h3>
            {!showPinInput ? (
              <button className="btn btn-primary btn-lg btn-full" onClick={() => setShowPinInput(true)}>
                🔐 Ingresar PIN
              </button>
            ) : (
              <div>
                <p style={{ marginBottom: 15 }}>Ingresa tu PIN de 4 dígitos</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 15 }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: checkinPin.length > i ? '#FF6B35' : '#333' }} />
                  ))}
                </div>
                <input
                  type="password"
                  className="input"
                  value={checkinPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setCheckinPin(val);
                    if (val.length === 4) setTimeout(verifyPinAndCheckIn, 300);
                  }}
                  placeholder="****"
                  maxLength="4"
                  autoFocus
                  style={{ fontSize: 24, textAlign: 'center', letterSpacing: 10 }}
                />
                <button className="btn btn-secondary btn-full" style={{ marginTop: 10 }} onClick={() => { setShowPinInput(false); setCheckinPin(''); }}>
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* Estado de empleados */}
          <div className="employees-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 15 }}>
            {employees.map(emp => {
              const activeSession = attendance.find(a => a.profile_id === emp.id && a.status === 'active');
              return (
                <div key={emp.id} className="card" style={{ borderLeft: activeSession ? '4px solid #27ae60' : '4px solid var(--border)' }}>
                  <h3 style={{ marginBottom: 5 }}>{emp.full_name}</h3>
                  <span className="badge" style={{ background: '#3498db', color: 'white', fontSize: 11 }}>{emp.role}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-secondary)' }}>PIN: {emp.pin}</span>
                  {activeSession ? (
                    <div style={{ marginTop: 10 }}>
                      <p style={{ fontSize: 12, color: '#27ae60' }}>🟢 Desde: {new Date(activeSession.check_in).toLocaleTimeString()}</p>
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 10 }}>⚪ Sin registrar</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'schedules' && (
        <div>
          <select className="input" style={{ maxWidth: 300, marginBottom: 20 }} onChange={(e) => { setSelectedEmployee(e.target.value); loadSchedules(e.target.value); }} value={selectedEmployee || ''}>
            <option value="">Seleccionar empleado...</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>

          {selectedEmployee && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 15 }}>Horario de {employees.find(e => e.id === selectedEmployee)?.full_name}</h3>
              <table className="data-table">
                <thead>
                  <tr><th>Día</th><th>Entrada</th><th>Salida</th><th></th></tr>
                </thead>
                <tbody>
                  {[0,1,2,3,4,5,6].map(day => {
                    const schedule = schedules.find(s => s.day_of_week === day);
                    return (
                      <tr key={day}>
                        <td>{days[day]}</td>
                        <td><input type="time" className="input" defaultValue={schedule?.start_time?.slice(0,5) || '09:00'} id={`start-${day}`} /></td>
                        <td><input type="time" className="input" defaultValue={schedule?.end_time?.slice(0,5) || '18:00'} id={`end-${day}`} /></td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => {
                            const start = document.getElementById(`start-${day}`).value;
                            const end = document.getElementById(`end-${day}`).value;
                            saveSchedule(selectedEmployee, day, start, end);
                          }}>💾</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Empleado</th><th>Check In</th><th>Check Out</th><th>Horas</th><th>Extra</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr><td colSpan="6" className="empty-table">Sin registros hoy</td></tr>
              ) : (
                attendance.map(reg => {
                  const emp = employees.find(e => e.id === reg.profile_id);
                  return (
                    <tr key={reg.id}>
                      <td>{emp?.full_name || 'N/A'}</td>
                      <td>{new Date(reg.check_in).toLocaleTimeString()}</td>
                      <td>{reg.check_out ? new Date(reg.check_out).toLocaleTimeString() : '---'}</td>
                      <td>{reg.hours_worked || '---'}</td>
                      <td style={{ color: reg.overtime > 0 ? '#f39c12' : '' }}>{reg.overtime || 0}</td>
                      <td><span className={`badge ${reg.status === 'active' ? 'badge-success' : 'badge-primary'}`}>{reg.status === 'active' ? 'Activo' : 'Completado'}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CompanyView;