import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'tenant', national_id: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/register', form);
      setSuccess(data.message || 'Registration successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
      setLoading(false);
    }
  }

  function set(k, v) {
    if (k === 'phone') {
      // Check if starts with +
      let hasPlus = v.startsWith('+');
      // Remove non-digits except +
      let digits = v.replace(/[^\d+]/g, '');
      // Extract country code and digits
      let countryCode = '';
      let phoneDigits = digits.replace(/\D/g, '').slice(0, 10);
      
      if (digits.startsWith('+')) {
        countryCode = '+';
        phoneDigits = digits.slice(1).replace(/\D/g, '').slice(0, 10);
      }
      
      // Format as XXXX XXX XXX
      let formatted = '';
      if (phoneDigits.length > 4) {
        formatted = phoneDigits.slice(0, 4) + ' ' + phoneDigits.slice(4);
      } else {
        formatted = phoneDigits;
      }
      if (phoneDigits.length > 7) {
        formatted = phoneDigits.slice(0, 4) + ' ' + phoneDigits.slice(4, 7) + ' ' + phoneDigits.slice(7);
      }
      
      v = countryCode + formatted;
    }
    if (k === 'national_id') {
      // Remove non-digits and limit to 9 digits
      v = v.replace(/\D/g, '').slice(0, 9);
    }
    setForm(f => ({ ...f, [k]: v }));
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', marginBottom: 6 }}>
          Nyumba<span style={{ color: '#16a34a' }}>Link</span>
        </div>
        <h2 style={{ marginBottom: 4 }}>Create an account</h2>
        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>Who are you?</div>

        {/* Role selector */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
          {[['tenant', '🏠', 'Looking for a house'], ['caretaker', '🔑', 'Property Manager']].map(([role, icon, label]) => (
            <div key={role} onClick={() => set('role', role)}
              style={{ flex: 1, border: `2px solid ${form.role === role ? '#16a34a' : '#e5e7eb'}`,
                background: form.role === role ? '#f0fdf4' : '#fff',
                borderRadius: 12, padding: '14px 10px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 28, marginBottom: 5 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: form.role === role ? '#16a34a' : '#444' }}>{label}</div>
            </div>
          ))}
        </div>

        {error && <div className="error-msg">{error}</div>}
        {success && <div style={{ marginBottom: 14, padding: '12px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#166534', borderRadius: 10 }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field"><label>Full Name</label>
            <input type="text" placeholder="Alice Njeri" required value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="field"><label>Phone Number</label>
            <input type="tel" placeholder="+254 712 345 678" value={form.phone} onChange={e => set('phone', e.target.value)} maxLength="18" inputMode="numeric" />
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Format: +254 712 345 678 or 0712 345 678</div>
          </div>
          <div className="field"><label>Email</label>
            <input type="email" placeholder="you@example.com" required pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="field"><label>National ID {form.role === 'caretaker' && '(required)'}</label>
            <input type="text" placeholder="e.g. 38291047" value={form.national_id} onChange={e => set('national_id', e.target.value)} maxLength="9" inputMode="numeric" />
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>8 or 9 digits (numbers only)</div>
          </div>
          <div className="field"><label>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" required minLength={6} maxLength={16} value={form.password} onChange={e => set('password', e.target.value)} />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  border: 'none', background: 'transparent', color: '#6b7280', cursor: 'pointer', padding: 0,
                  fontSize: 13, fontWeight: 700
                }}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Password must be 6-16 characters long</div>
          </div>
          <button type="submit" className="btn btn-green w-full btn-lg" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 16 }}>
          Already have an account? <Link to="/login" style={{ color: '#16a34a', fontWeight: 600 }}>Sign in →</Link>
        </div>
      </div>
    </div>
  );
}
