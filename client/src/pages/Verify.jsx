import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function Verify() {
  const { token } = useParams();
  const [status, setStatus] = useState('Verifying your email...');
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    axios.get(`/api/auth/verify/${token}`)
      .then(response => setStatus(response.data.message || 'Email verified successfully.'))
      .catch(err => setError(err.response?.data?.error || 'Verification failed.'));
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) return setResendMessage('Please enter your email');
    try {
      const response = await axios.post('/api/auth/resend-verification', { email: resendEmail });
      setResendMessage(response.data.message);
    } catch (err) {
      setResendMessage(err.response?.data?.error || 'Failed to resend');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', marginBottom: 6 }}>
          Nyumba<span style={{ color: '#16a34a' }}>Link</span>
        </div>
        <h2 style={{ marginBottom: 4 }}>Email Verification</h2>
        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
          Confirming your account now.
        </div>
        {error ? (
          <div className="error-msg">{error}</div>
        ) : (
          <div style={{ marginBottom: 20, color: '#166534', fontWeight: 600 }}>{status}</div>
        )}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/login" style={{ color: '#16a34a', fontWeight: 700 }}>Go to login</Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={() => setShowResend(!showResend)} style={{ background: 'none', border: 'none', color: '#16a34a', textDecoration: 'underline', cursor: 'pointer' }}>
            Didn't receive the email? {showResend ? 'Hide' : 'Resend verification'}
          </button>
        </div>
        {showResend && (
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <input
              type="email"
              placeholder="Enter your email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              style={{ padding: 8, marginRight: 10, border: '1px solid #ccc', borderRadius: 4, width: '200px' }}
            />
            <button onClick={handleResend} style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Resend</button>
            {resendMessage && <div style={{ marginTop: 10, color: resendMessage.includes('sent') ? '#166534' : '#dc2626' }}>{resendMessage}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
