// src/routes/PrivateRoute.jsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../Services/auth/authService';
import { AuthProvider } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';

const PrivateRoute = ({ children }) => {
  const [authStatus, setAuthStatus] = useState(null);
  useSocket()

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const result = await isAuthenticated();
        if (isMounted) setAuthStatus(result);
      } catch (error) {
        console.error("Error checking authentication status in PrivateRoute:", error);
        if (isMounted) setAuthStatus(false);
      }
    };
    checkAuth();
    return () => { isMounted = false; };
  }, []);

  if (authStatus === null) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5em' }}>Verificando sesión...</div>;
  }

  if (!authStatus) {
    return <Navigate to="/" replace />;
  }

  return <AuthProvider>{children}</AuthProvider>;
};

export default PrivateRoute;