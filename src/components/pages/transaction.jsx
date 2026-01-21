import React, { Fragment, useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { AuthProvider } from '../../../context/AuthContext';
import ProtectedRoute from '../../../middleware/ProtectedRoute';

// --- Komponen Pembantu ---
const Button = ({ children, className = "bg-blue-600", onClick, type = "button", disabled = false }) => {
  return (
    <button
      type={type}
      className={`h-10 px-6 font-semibold rounded-lg text-white ${className} hover:opacity-90 transition duration-200 shadow-md ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// --- Fungsi Utilitas ---
const getUserSession = () => {
    const storedUserId = localStorage.getItem("uid");
    const storedEmail = localStorage.getItem("email");
    
    return {
        userId: storedUserId || null,
        userEmail: storedEmail || ""
    };
};

const formatPrice = (p) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(p);

const getStatusBadge = (status) => {
    switch (status) {
        case 'Berhasil':
            return 'bg-green-100 text-green-800';
        case 'Dibatalkan':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-yellow-100 text-yellow-800';
    }
};

// --- Komponen Utama ---
const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const { userEmail } = getUserSession();
  const isAdmin = userEmail === "admin@gmail.com";

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userEmail) {
        setError("Sesi berakhir. Silakan login kembali.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const historyRef = collection(db, "riwayat");
        let q;

        if (isAdmin) {
          q = query(historyRef, orderBy("createdAt", "desc"));
        } else {
          q = query(
            historyRef,
            where("userEmail", "==", userEmail),
            orderBy("createdAt", "desc")
          );
        }
  
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
  
        setTransactions(data);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Gagal memuat riwayat transaksi dari Firestore.");
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchTransactions();
  }, [userEmail, isAdmin]);

  return (
    <AuthProvider>
    <ProtectedRoute>
    <Fragment>
      <header className="flex justify-between h-20 bg-blue-700 text-white items-center px-6 md:px-10 shadow-lg">
        <div>
            <h1 className="text-xl md:text-2xl font-bold">Riwayat Transaksi</h1>
            <p className="text-xs opacity-80 italic">
                Login sebagai: {userEmail} {isAdmin && "(Administrator)"}
            </p>
        </div>
        <Button 
            className="bg-purple-600 hover:bg-purple-700" 
            onClick={() => navigate("/productUser")}
        >
            Kembali ke Toko
        </Button>
      </header>
      
      <div className="p-4 md:p-10">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 border-b pb-2">
            {isAdmin ? "Seluruh Transaksi Masuk" : "Daftar Transaksi Saya"}
        </h2>

        {isLoading && (
            <div className="text-center p-10 text-xl text-blue-600 font-medium">
                <span className="animate-pulse">Memuat data transaksi...</span>
            </div>
        )}

        {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-sm">
                <p className="font-bold">Terjadi Kesalahan:</p>
                <p>{error}</p>
            </div>
        )}

        {!isLoading && !error && transactions.length === 0 && (
            <div className="p-10 bg-gray-50 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg text-center text-lg">
                <p>Belum ada riwayat transaksi yang tercatat.</p>
            </div>
        )}

        {!isLoading && !error && transactions.length > 0 && (
            <div className="overflow-x-auto shadow-2xl rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">ID</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Tanggal</th>
                            {isAdmin && (
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Email Pembeli</th>
                            )}
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Detail Barang</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Total</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Status</th>
                            {/* Tambahkan kolom aksi jika bukan admin */}
                            {!isAdmin && (
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Aksi</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((t) => (
                            <tr key={t.id} className="hover:bg-blue-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                                    #{t.id.substring(0, 6)}...
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleString('id-ID') : 'N/A'}
                                </td>
                                {isAdmin && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                        {t.userEmail}
                                    </td>
                                )}
                                <td className="px-6 py-4 text-sm text-gray-700">
                                    <ul className="list-disc ml-4 space-y-1">
                                        {(t.items || []).map((item, index) => (
                                            <li key={index} className="text-xs">
                                                <span className="font-semibold">{item.title}</span> 
                                                <span className="text-gray-500"> ({item.qty}x)</span>
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                    {formatPrice(t.total)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getStatusBadge(t.status)}`}>
                                        {t.status}
                                    </span>
                                </td>
                                {/* Logika tombol Bayar */}
                                {!isAdmin && (
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {t.status === 'Menunggu Pembayaran' ? (
                                            <button
                                                onClick={() => navigate(`/payment/${t.id}`)}
                                                className="bg-orange-500 hover:bg-orange-600 text-white text-xs py-1.5 px-4 rounded-md font-bold transition duration-200 shadow-sm"
                                            >
                                                Bayar Sekarang
                                            </button>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">-</span>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </Fragment>
    </ProtectedRoute>
    </AuthProvider>
  );
};

export default TransactionHistory;