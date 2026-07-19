import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <div className="min-h-screen grid place-items-center text-white">Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}