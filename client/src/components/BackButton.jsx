import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Check if we're on home page
    if (location.pathname === '/') {
      setCanGoBack(false);
    } else {
      setCanGoBack(true);
    }
  }, [location.pathname]);

  if (!canGoBack) return null;

  return (
    <button
      onClick={() => navigate(-1)}
      style={{
        position: 'fixed',
        top: 16,
        left: 16,
        zIndex: 1000,
        background: '#16a34a',
        color: '#fff',
        border: 'none',
        borderRadius: '50%',
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 24,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.target.style.background = '#15803d';
        e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = '#16a34a';
        e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
      }}
      title="Go back"
    >
      ←
    </button>
  );
}
