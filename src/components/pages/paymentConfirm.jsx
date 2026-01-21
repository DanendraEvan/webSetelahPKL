import React, { Fragment, useEffect, useState } from 'react';
// Catatan: Jika Anda menggunakan react-router-dom, Anda memerlukan hook berikut.
// Saya asumsikan Anda mendapatkan ID transaksi dari URL (misalnya: /payment/123)
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

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
  const { transactionId } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const formatPrice = (p) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(p);

  // 🔹 1. Ambil data transaksi dari Firestore
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId) {
        setError("ID Transaksi tidak ditemukan");
        setIsLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "riwayat", transactionId);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
          throw new Error("Transaksi tidak ditemukan");
        }

        setTransaction({ id: snap.id, ...snap.data() });
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransaction();
  }, [transactionId]);

  // 🔹 2. Konfirmasi pembayaran (update Firestore)
  const handleConfirmPayment = async () => {
    if (!transaction || transaction.status === "Berhasil") {
      alert("Transaksi sudah dibayar");
      return;
    }

    setIsUpdating(true);

    try {
      const docRef = doc(db, "riwayat", transactionId);

      await updateDoc(docRef, {
        status: "Berhasil",
      });

      setTransaction((prev) => ({ ...prev, status: "Berhasil" }));
      alert("Pembayaran berhasil dikonfirmasi");

      setTimeout(() => navigate("/transactions"), 1000);
    } catch (err) {
      console.error(err);
      alert("Gagal mengkonfirmasi pembayaran");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-blue-600">
          Memuat pembayaran...
        </h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="mt-2">{error}</p>
        <button onClick={() => navigate("/")}>Kembali</button>
      </div>
    );
  }

  const isPending = transaction.status === "Menunggu Pembayaran";

  return (
    <Fragment>
      <header className="flex justify-between h-20 bg-blue-700 text-white items-center px-8">
        <h1 className="text-2xl font-bold">Pembayaran</h1>
        <button onClick={() => navigate("/")}>Kembali ke Toko</button>
      </header>

      <div className="max-w-3xl mx-auto p-6 mt-8 bg-white shadow-xl rounded-xl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold">Total Pembayaran</h2>
          <p className="text-4xl font-extrabold text-green-600">
            {formatPrice(transaction.total)}
          </p>
        </div>

        <div className="border p-4 rounded-lg mb-6">
          <p>
            <b>ID Transaksi:</b> {transaction.id}
          </p>
          <p>
            <b>Status:</b> {transaction.status}
          </p>
        </div>

        <h3 className="text-xl font-semibold mb-3">Detail Pesanan</h3>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Produk</th>
              <th className="p-2 text-center">Qty</th>
              <th className="p-2 text-right">Harga</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items.map((item, i) => (
              <tr key={i}>
                <td className="p-2">{item.title}</td>
                <td className="p-2 text-center">{item.qty}</td>
                <td className="p-2 text-right">
                  {formatPrice(item.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isPending ? (
          <button
            onClick={handleConfirmPayment}
            disabled={isUpdating}
            className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg font-bold"
          >
            {isUpdating ? "Memproses..." : "Konfirmasi Pembayaran"}
          </button>
        ) : (
          <div className="mt-6 text-center text-green-700 font-semibold">
            Pembayaran sudah berhasil
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          Dibuat pada:{" "}
          {transaction.createdAt?.toDate().toLocaleString("id-ID")}
        </p>
      </div>
    </Fragment>
  );
};

export default PaymentConfirmation;
