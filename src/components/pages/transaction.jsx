import React, { Fragment, useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";


// CATATAN: Definisi komponen pembantu (Button, dll.) wajib disematkan
// agar file ini dapat berjalan sebagai satu kesatuan.
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

// Fungsi utilitas untuk mendapatkan user ID dari localStorage 
const getUserId = () => {
    // Mengambil user_id dari localStorage atau mengembalikan ID 1
    const storedUserId = localStorage.getItem("user_id");
    return storedUserId ? parseInt(storedUserId) : 1; 
};

// Fungsi format harga ke Rupiah
const formatPrice = (p) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(p);

// Fungsi untuk mendapatkan style badge berdasarkan status
const getStatusBadge = (status) => {
    switch (status) {
        case 'Berhasil':
            return 'bg-green-100 text-green-800';
        case 'Dibatalkan':
            return 'bg-red-100 text-red-800';
        case 'Sedang diproses':
        default:
            return 'bg-yellow-100 text-yellow-800';
    }
};

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userId = getUserId();

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, "riwayat"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );
  
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
  }, [userId]);
  


  return (
    <Fragment>
      <header className="flex justify-between h-20 bg-blue-700 text-white items-center px-6 md:px-10 shadow-lg">
        <h1 className="text-2xl font-bold">Riwayat Transaksi Pengguna ID: {userId}</h1>
        <Button 
            className="bg-purple-600 hover:bg-purple-700" 
            onClick={() => navigate("/productUser")}
        >
            Kembali ke Toko
        </Button>
      </header>
      
      <div className="p-4 md:p-10">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 border-b pb-2">Daftar Transaksi</h2>

        {isLoading && (
            <div className="text-center p-10 text-xl text-blue-600">
                Memuat data transaksi...
            </div>
        )}

        {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <p className="font-bold">Error:</p>
                <p>{error}</p>
            </div>
        )}

        {!isLoading && !error && transactions.length === 0 && (
            <div className="p-6 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg text-center text-lg">
                <p>Anda belum memiliki riwayat transaksi.</p>
            </div>
        )}

        {!isLoading && !error && transactions.length > 0 && (
            <div className="overflow-x-auto shadow-xl rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Transaksi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail Barang (Snapshot)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Harga</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((t) => (
                            <tr key={t.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    #{t.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {t.createdAt?.toDate().toLocaleString('id-ID')}

                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                    {/* Menampilkan daftar barang dari JSONB */}
                                    <ul className="list-disc ml-4 space-y-1">
                                        {/* items_snapshot adalah JSON string dari server, perlu diparse jika server tidak melakukannya */}
                                        {(t.items || []).map((item, index) => (

                                            <li key={index} className="text-xs">
                                                <span className="font-semibold">{item.title}</span> ({item.quantity}x) - {formatPrice(item.price_at_order)}
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                {formatPrice(t.total)}

                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span 
                                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(t.status)}`}
                                    >
                                        {t.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </Fragment>
  );
};

export default TransactionHistory;