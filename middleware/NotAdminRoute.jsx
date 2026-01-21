import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  // 1. Tunggu proses cek auth selesai
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="ml-3">Memverifikasi Admin...</p>
      </div>
    );
  }

  // 2. Ambil email dari user Firebase atau localStorage
  const currentUserEmail = user?.email || localStorage.getItem("email");

  // 3. Cek apakah dia admin
  if (currentUserEmail !== "admin@gmail.com") {
    return children;
  }

  // 4. Jika bukan admin, tendang kembali ke halaman product user atau login
  // Kita gunakan 'replace' agar user tidak bisa klik tombol 'back' ke halaman admin
  return <Navigate to="/product" replace />;
}