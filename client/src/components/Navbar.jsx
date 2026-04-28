import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  function dashLink() {
    if (user?.role === 'tenant') return '/tenant';
    if (user?.role === 'caretaker') return '/caretaker';
    if (user?.role === 'admin') return '/admin';
  }

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 24 }}>🏠</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>
            <span style={{ color: '#1a1a2e' }}>Nyumba</span>
            <span style={{ color: '#16a34a' }}>Link</span>
          </div>
        </div>
      </Link>
      <div className="navbar-links">
        <Link to="/search">
          <button className="btn btn-outline btn-sm">Browse Houses</button>
        </Link>
        {user ? (
          <>
            <Link to={dashLink()}>
              <button className="btn btn-outline btn-sm">My Dashboard</button>
            </Link>
            <button className="btn btn-green btn-sm" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/register">
              <button className="btn btn-outline btn-sm">Sign Up</button>
            </Link>
            <Link to="/login">
              <button className="btn btn-green btn-sm">Login</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
