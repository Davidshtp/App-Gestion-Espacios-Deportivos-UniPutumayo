// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserData, logout } from '../Services/auth/authService';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getUserData();
        if (profile) {
          setUser({
            userId: profile.usuario_id,
            rolId: profile.rol.id_rol,
            nombreCompleto: `${profile.nombre} ${profile.apellido}`,
            email: profile.correo,
            urlImage: profile.urlimage
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error al obtener el perfil del usuario:", err);
        setError("No se pudo cargar la información del usuario.");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      setUser(null);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  const authContextValue = { user, loading, error, handleLogout };

  
  if (loading) {
    return (
      <div className="loading-full-screen" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5em', color: '#555' }}>
        Cargando sesión...
      </div>
    );
  }

  if (error || !user) { // Si hay un error, o si la carga terminó pero no hay usuario (ej. no autenticado)
    return (
      <div className="error-full-screen" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5em', color: 'red', textAlign: 'center' }}>
        <p>Error de autenticación o sesión no iniciada.</p>
        <p>Por favor, <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>inicia sesión</a>.</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};