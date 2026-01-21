import React, { Fragment, useEffect, useState } from 'react';
// Catatan: Jika Anda menggunakan react-router-dom, Anda memerlukan hook berikut.
// Saya asumsikan Anda mendapatkan ID transaksi dari URL (misalnya: /payment/123)
import { useNavigate, useParams } from "react-router-dom";

// =========================================================================
// --- DEFINISI KOMPONEN PEMBANTU (Wajib ada) ---
// =========================================================================
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
            return 'bg-green-100 text-green-800 border-green-400';
        case 'Dibatalkan':
            return 'bg-red-100 text-red-800 border-red-400';
        case 'Sedang diproses':
        default:
            return 'bg-yellow-100 text-yellow-800 border-yellow-400';
    }
};
// --- AKHIR DEFINISI KOMPONEN PEMBANTU ---


const PaymentConfirmation = () => {
    // Anggap route adalah /payment/:transactionId
    const { transactionId } = useParams(); 
    const navigate = useNavigate();
    
    const [transaction, setTransaction] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // 1. Ambil detail transaksi
    useEffect(() => {
        const fetchTransaction = async () => {
            if (!transactionId) {
                setError("ID Transaksi tidak ditemukan.");
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch(`http://localhost:5000/api/transactions/${transactionId}`);
                
                if (!res.ok) {
                    throw new Error(`Gagal memuat detail transaksi. Kode: ${res.status}`);
                }
                
                const data = await res.json();
                // Pastikan items_snapshot yang diterima dari server adalah array (jika server mengirim string JSON, harus di-parse)
                if (typeof data.items_snapshot === 'string') {
                    data.items_snapshot = JSON.parse(data.items_snapshot);
                }
                setTransaction(data);
            } catch (err) {
                console.error("Error fetching transaction:", err);
                setError(err.message || "Gagal memuat detail transaksi.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransaction();
    }, [transactionId]);


    // 2. Fungsi untuk Konfirmasi Pembayaran
    const handleConfirmPayment = async () => {
        if (!transaction || transaction.status === 'Berhasil') {
            window.alert("Transaksi sudah berstatus Berhasil.");
            return;
        }

        setIsUpdating(true);

        try {
            const res = await fetch(`http://localhost:5000/api/transactions/${transactionId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newStatus: "Berhasil" }),
            });

            const data = await res.json();

            if (res.ok) {
                // Update state lokal dan berikan notifikasi
                setTransaction(prev => ({ ...prev, status: "Berhasil" }));
                window.alert(`Pembayaran transaksi #${transactionId} berhasil dikonfirmasi!`);
                
                // Opsional: Arahkan ke riwayat transaksi setelah konfirmasi
                setTimeout(() => navigate("/transactions"), 1000); 

            } else {
                window.alert(`Gagal mengupdate status: ${data.error || "Terjadi kesalahan server."}`);
            }
        } catch (error) {
            console.error("Error updating status:", error);
            window.alert("Gagal koneksi ke server untuk konfirmasi pembayaran.");
        } finally {
            setIsUpdating(false);
        }
    };


    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
                <h1 className="text-3xl font-bold text-blue-600">Memuat Konfirmasi Pembayaran...</h1>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-6">
                <h1 className="text-3xl font-bold text-red-600">Terjadi Kesalahan</h1>
                <p className="mt-4 text-gray-700">{error}</p>
                <Button className="bg-blue-600 mt-6" onClick={() => navigate("/")}>
                    Kembali ke Beranda
                </Button>
            </div>
        );
    }

    const isPaymentPending = transaction.status === 'Sedang diproses';


    return (
        <Fragment>
            <header className="flex justify-between h-20 bg-blue-700 text-white items-center px-6 md:px-10 shadow-lg">
                <h1 className="text-2xl font-bold">Konfirmasi Pembayaran</h1>
                <Button 
                    className="bg-purple-600 hover:bg-purple-700" 
                    onClick={() => navigate("/")}
                >
                    Kembali ke Toko
                </Button>
            </header>

            <div className="max-w-3xl mx-auto p-4 md:p-8 mt-8 bg-white shadow-2xl rounded-xl">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-extrabold text-gray-900 mb-2">Total yang Harus Dibayar</h2>
                    <p className="text-5xl font-extrabold text-green-600">
                        {formatPrice(transaction.total_price)}
                    </p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-6 mb-8 bg-blue-50">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                        <span className="text-lg font-semibold text-gray-700">ID Transaksi:</span>
                        <span className="text-lg font-bold text-blue-800">#{transaction.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-700">Status Saat Ini:</span>
                        <span 
                            className={`px-4 py-1 inline-flex text-base leading-5 font-bold rounded-full border ${getStatusBadge(transaction.status)}`}
                        >
                            {transaction.status}
                        </span>
                    </div>
                </div>

                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Detail Pesanan</h3>
                <div className="mb-8 border border-gray-100 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Satuan</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {(transaction.items_snapshot || []).map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{item.quantity}x</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">{formatPrice(item.price_at_order)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {isPaymentPending && (
                    <Button 
                        className="bg-green-700 hover:bg-green-800 w-full py-3 text-xl font-bold"
                        onClick={handleConfirmPayment}
                        disabled={isUpdating}
                    >
                        {isUpdating ? 'Mengkonfirmasi...' : 'Konfirmasi Pembayaran (Tandai Berhasil)'}
                    </Button>
                )}
                {!isPaymentPending && (
                    <div className="text-center p-4 bg-green-50 border border-green-300 rounded-lg">
                        <p className="text-lg font-semibold text-green-700">Pembayaran Selesai!</p>
                        <p className="text-sm text-gray-600 mt-1">Status transaksi ini sudah **Berhasil**.</p>
                    </div>
                )}
                
                <p className="text-center text-sm text-gray-500 mt-4">
                    Transaksi dibuat pada: {new Date(transaction.transaction_date).toLocaleString('id-ID')}
                </p>
            </div>
        </Fragment>
    );
};

export default PaymentConfirmation;
