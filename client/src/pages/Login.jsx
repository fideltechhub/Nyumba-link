import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', form);
      login(data.token, data.user);
      if (data.user.role === 'tenant') navigate('/tenant');
      else if (data.user.role === 'caretaker') navigate('/caretaker');
      else navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', marginBottom: 6 }}>
          Naija<span style={{ color: '#ca8a04' }}>Homes</span>
        </div>
        <h2 style={{ marginBottom: 4 }}>Welcome back</h2>
        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>Sign in to your account</div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" required
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="field">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" required
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  border: 'none', background: 'transparent', color: '#6b7280', cursor: 'pointer', padding: 0,
                  fontSize: 13, fontWeight: 700
                }}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-green w-full btn-lg" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 16 }}>
          No account? <Link to="/register" style={{ color: '#16a34a', fontWeight: 600 }}>Sign up →</Link>
        </div>

        <div style={{ marginTop: 20, padding: '14px', background: '#f9fafb', borderRadius: 10, fontSize: 12, color: '#6b7280' }}>
          <strong>Admin login:</strong> nyumbalink@gmail.com / admin123
        </div>
      </div>
    </div>
  );
}
