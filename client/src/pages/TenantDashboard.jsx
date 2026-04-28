import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_PILL = { pending: 'pill-yellow', confirmed: 'pill-green', rejected: 'pill-red', cancelled: 'pill-gray' };
const STATUS_LABEL = { pending: '⏳ Pending', confirmed: '✓ Confirmed', rejected: '✗ Rejected', cancelled: 'Cancelled' };

export default function TenantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  useEffect(() => {
    axios.get('/api/bookings/my').then(r => setBookings(r.data)).finally(() => setLoading(false));
  }, []);

  async function cancelBooking(id) {
    if (!confirm('Cancel this booking request?')) return;
    await axios.patch(`/api/bookings/${id}/cancel`);
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
  }

  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const pending = bookings.filter(b => b.status === 'pending');

  if (loading) return <div className="spinner">Loading...</div>;

  return (
    <div className="dash-layout">
      <div className="dash-sidebar">
        <div className="user-info">
          <div className="avatar" style={{ background: '#2563eb' }}>{user?.name?.[0]}</div>
          <div className="user-name">{user?.name}</div>
          <div className="user-role">Tenant</div>
        </div>
        <nav className="dash-nav">
          <a href="#" className={tab === 'bookings' ? 'active' : ''} onClick={e => { e.preventDefault(); setTab('bookings'); }}>📋 My Bookings</a>
          <a href="#" onClick={e => { e.preventDefault(); navigate('/search'); }}>🔍 Browse Houses</a>
          <a href="#" className={tab === 'change-password' ? 'active' : ''} onClick={e => { e.preventDefault(); setTab('change-password'); }}>🔐 Change Password</a>
        </nav>
      </div>

      <div className="dash-main">
        {msg && <div className={msg.includes('✅') ? 'success-msg' : 'error-msg'} style={{ marginBottom: 16 }}>{msg} <button style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setMsg('')}>✕</button></div>}

        {tab === 'bookings' && (
          <>
            <h2>My Dashboard</h2>
            <div className="sub">Good day, {user?.name?.split(' ')[0]} 👋</div>

            <div className="stat-row">
              <div className="stat-box"><div className="n">{bookings.length}</div><div className="l">Total Requests</div></div>
              <div className="stat-box"><div className="n" style={{ color: '#ca8a04' }}>{pending.length}</div><div className="l">Pending</div></div>
              <div className="stat-box"><div className="n">{confirmed.length}</div><div className="l">Confirmed</div></div>
            </div>

            <div className="table-card">
              <h3>📋 My Booking Requests</h3>
          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🏠</div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>No bookings yet</div>
              <button className="btn btn-green" onClick={() => navigate('/search')}>Browse Houses</button>
            </div>
          ) : bookings.map(b => (
            <div key={b.id} className="row-item">
              <div style={{ flex: 1 }}>
                <div className="row-title">{b.title}</div>
                <div className="row-sub">📍 {b.sub_location || b.location} · KES {Number(b.price).toLocaleString()}/mo</div>
                <div className="row-sub">📅 Viewing: {b.viewing_date}</div>
                {b.status === 'confirmed' && (
                  <div className="row-sub" style={{ color: '#15803d', fontWeight: 600 }}>
                    📞 Caretaker: {b.caretaker_name} · {b.caretaker_phone}
                  </div>
                )}
              </div>
              <span className={`pill ${STATUS_PILL[b.status]}`}>{STATUS_LABEL[b.status]}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-blue btn-sm" onClick={() => navigate(`/listings/${b.listing_id}`)}>View House</button>
                {b.status === 'pending' && (
                  <button className="btn btn-red btn-sm" onClick={() => cancelBooking(b.id)}>Cancel</button>
                )}
              </div>
            </div>
          ))}
            </div>

            {confirmed.length > 0 && (
              <div className="table-card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <h3 style={{ color: '#15803d' }}>✓ What to do next</h3>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
                  You have <strong>{confirmed.length}</strong> confirmed viewing{confirmed.length > 1 ? 's' : ''}. Contact the caretaker using the phone number shown above to arrange your visit. If the house works for you, ask about reserving it!
                </p>
              </div>
            )}
          </>
        )}

        {tab === 'change-password' && (
          <>
            <h2>Change Password</h2>
            <div className="sub">Update your account password</div>
            <div className="table-card" style={{ maxWidth: 400 }}>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (pwdForm.newPassword !== pwdForm.confirmPassword) {
                  setMsg('❌ Passwords do not match');
                  return;
                }
                if (pwdForm.newPassword.length < 6) {
                  setMsg('❌ Password must be at least 6 characters');
                  return;
                }
                setPwdLoading(true);
                try {
                  await axios.post('/api/auth/change-password', {
                    currentPassword: pwdForm.currentPassword,
                    newPassword: pwdForm.newPassword
                  });
                  setMsg('✅ Password changed successfully!');
                  setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                } catch (e) {
                  setMsg('❌ ' + (e.response?.data?.error || 'Failed to change password'));
                } finally {
                  setPwdLoading(false);
                }
              }}>
                <div className="field">
                  <label>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showCurrentPwd ? 'text' : 'password'} placeholder="Enter current password" required
                      value={pwdForm.currentPassword} onChange={e => setPwdForm({...pwdForm, currentPassword: e.target.value})} />
                    <button type="button" onClick={() => setShowCurrentPwd(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#6b7280', cursor: 'pointer', padding: 0, fontSize: 13, fontWeight: 700 }}>
                      {showCurrentPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showNewPwd ? 'text' : 'password'} placeholder="Enter new password" required
                      value={pwdForm.newPassword} onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})} />
                    <button type="button" onClick={() => setShowNewPwd(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#6b7280', cursor: 'pointer', padding: 0, fontSize: 13, fontWeight: 700 }}>
                      {showNewPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirmPwd ? 'text' : 'password'} placeholder="Confirm new password" required
                      value={pwdForm.confirmPassword} onChange={e => setPwdForm({...pwdForm, confirmPassword: e.target.value})} />
                    <button type="button" onClick={() => setShowConfirmPwd(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#6b7280', cursor: 'pointer', padding: 0, fontSize: 13, fontWeight: 700 }}>
                      {showConfirmPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-green" disabled={pwdLoading}>
                  {pwdLoading ? '⏳ Updating...' : '✓ Change Password'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
