import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  // 1. Tunggu loading Firebase selesai
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="ml-3">Memvalidasi Sesi...</p>
      </div>
    );
  }

  // 2. Ambil email dari user Firebase atau localStorage sebagai cadangan
  const currentUserEmail = user?.email || localStorage.getItem("email");

  if (currentUserEmail) {
    // Jika email adalah admin, paksa ke halaman product admin
    if (currentUserEmail === "admin@gmail.com") {
      return <Navigate to="/product" replace />;
    }
    
    // Jika user biasa yang sudah login, paksa ke product user
    return <Navigate to="/productUser" replace />;
  }

  // 3. Jika benar-benar tidak ada user (null), baru boleh akses Login/Register
  return children;
}