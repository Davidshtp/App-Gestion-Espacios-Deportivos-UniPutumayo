import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login/Login';
import { GoogleOAuthProvider } from "@react-oauth/google";
import PrivateRoute from './routes/PrivateRoute';
import Inicio from './pages/Inicio/Inicio';
import Reservar from './pages/Reservar/Reservar';
import DashboardLayout from './components/Layout/DashboardLayout';
import GestionEventos from './components/Eventos/Eventos';
import 'flatpickr/dist/themes/material_blue.css';
import AdminRoute from './routes/AdminRoute';
import AccessDenied from './components/AccessDenied/AccesDenied';
import GestionEspacios from "./components/GestionEspacios/GestionEspacios"
import GestionDeportes from './components/GestionDeportes/GestionDeportes';
import ProfilePage from './pages/Perfil/ProfilePage';





const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId={CLIENT_ID}>
    <Router>
      <Routes>
        {/* Ruta pública */}
        <Route path="/" element={<Login />} />

        {/* Rutas protegidas bajo el layout solo si el usuario esta autenticado */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route path="inicio" element={<Inicio />} />
          <Route path="reservar" element={<Reservar />} />
          <Route path='accesDenied' element={<AccessDenied />}></Route>
          <Route path='perfil' element={<ProfilePage/>}></Route>
          {/* rutas para solo admins  */}
          <Route
            path="eventos"
            element={
              <AdminRoute>
                <GestionEventos />
              </AdminRoute>
            }
          />
          <Route
            path="espacios"
            element={
              <AdminRoute>
                <GestionEspacios />
              </AdminRoute>
            }
          />
          <Route
            path="deportes"
            element={
              <AdminRoute>
                <GestionDeportes />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  </GoogleOAuthProvider>
);
