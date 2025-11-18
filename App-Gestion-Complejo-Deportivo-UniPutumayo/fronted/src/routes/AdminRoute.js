import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.rolId !== 1) {
    return <Navigate to="/accesDenied" replace />; // o redirige a donde quieras
  }

  return children;
}
