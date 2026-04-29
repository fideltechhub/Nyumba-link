import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://nairobi-houses-backend-web-app.onrender.com';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set axios default auth header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // On mount, restore session from localStorage token
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      
      try {
        // Set auth header for this request
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        // Fetch current user to validate token and restore session
        const response = await axios.get('/api/auth/me');
        setUser(response.data);
        setToken(storedToken);
      } catch (err) {
        // Token is invalid, clear it
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  function login(tok, userData) {
    setToken(tok);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${tok}`;
    localStorage.setItem('token', tok);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
