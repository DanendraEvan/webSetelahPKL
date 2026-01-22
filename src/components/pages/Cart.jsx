import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; 
import { getCart, saveCart, clearCart, updateQty } from "../../utils/cart";

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setCart(getCart());
  }, []);

  const total = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  }, [cart]);

  const handleUpdateQty = (id, action) => {
    updateQty(id, action);
    const updatedCart = getCart();
    setCart(updatedCart);
    window.dispatchEvent(new Event("storage_updated"));
  };

  const handleRemove = (id) => {
    if (window.confirm("Hapus item ini dari keranjang?")) {
      const updated = cart.filter(item => item.id !== id);
      saveCart(updated);
      setCart(updated);
      window.dispatchEvent(new Event("storage_updated"));
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const userEmail = localStorage.getItem("email");
    if (!userEmail) {
      alert("Silakan login terlebih dahulu");
      return navigate("/login");
    }

    setIsCheckingOut(true);
    try {
      const transactionData = {
        userEmail: userEmail,
        items: cart,
        total: total,
        status: "Menunggu Pembayaran",
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "riwayat"), transactionData);
      clearCart();
      window.dispatchEvent(new Event("storage_updated"));
      
      navigate(`/payment/${docRef.id}`); 
    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Gagal memproses pesanan. Silakan coba lagi.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        
        {/* --- HEADER DENGAN GRADIENT & TOMBOL KEMBALI --- */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-6 text-white flex justify-between items-center shadow-lg">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🛒 Keranjang Belanja
            </h1>
            <p className="text-xs opacity-80 italic">Periksa kembali item pilihanmu</p>
          </div>
          <button 
            onClick={() => navigate("/productUser")} 
            className="bg-white/20 hover:bg-white/40 text-white px-4 py-2 rounded-lg backdrop-blur-md transition-all duration-300 font-semibold text-sm border border-white/30"
          >
            ← Kembali ke Toko
          </button>
        </div>

        <div className="p-6 md:p-8">
          {cart.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-7xl mb-4 animate-bounce">🛍️</div>
              <p className="text-gray-500 text-xl font-medium">Wah, keranjangmu masih kosong.</p>
              <button 
                onClick={() => navigate("/productUser")}
                className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition shadow-lg font-bold"
              >
                Mulai Belanja
              </button>
            </div>
          ) : (
            <>
              {/* --- LIST ITEM --- */}
              <div className="space-y-6">
                {cart.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-20 h-20 object-cover rounded-lg shadow-md border-2 border-white"
                        onError={(e) => { e.target.src = "https://placehold.co/100x100?text=Produk"; }}
                      />
                      <div>
                        <h2 className="font-bold text-gray-800 text-lg leading-tight">{item.title}</h2>
                        <p className="text-blue-600 font-extrabold mt-1">
                          Rp {item.price.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                      {/* --- KONTROL QUANTITY --- */}
                      <div className="flex items-center border-2 border-blue-100 rounded-xl bg-white overflow-hidden shadow-sm">
                        <button 
                          onClick={() => handleUpdateQty(item.id, 'minus')}
                          className="px-4 py-2 hover:bg-red-50 text-red-600 font-black transition-colors"
                        >
                          −
                        </button>
                        <span className="px-4 font-bold text-gray-800 border-x-2 border-blue-50 min-w-[45px] text-center">
                          {item.qty}
                        </span>
                        <button 
                          onClick={() => handleUpdateQty(item.id, 'add')}
                          className="px-4 py-2 hover:bg-green-50 text-green-600 font-black transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right min-w-[120px]">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Subtotal</p>
                        <p className="font-black text-gray-900 text-lg">
                          Rp {(item.price * item.qty).toLocaleString("id-ID")}
                        </p>
                        <button
                          className="text-red-500 text-xs font-bold hover:text-red-700 transition mt-1 uppercase"
                          onClick={() => handleRemove(item.id)}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* --- RINGKASAN PEMBAYARAN --- */}
              <div className="mt-10 pt-8 border-t-2 border-dashed border-gray-200">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-gray-600 font-semibold text-lg">Total yang harus dibayar:</span>
                  <div className="text-right">
                    <span className="block text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-900">
                      Rp {total.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <button
                  disabled={isCheckingOut}
                  onClick={handleCheckout}
                  className={`w-full py-4 rounded-2xl font-black text-xl shadow-xl transform transition-all duration-300 flex items-center justify-center gap-3
                    ${isCheckingOut 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:scale-[1.02] hover:shadow-2xl active:scale-95'
                    }`}
                >
                  {isCheckingOut ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Memproses...
                    </>
                  ) : (
                    "💳 Lanjut ke Pembayaran"
                  )}
                </button>
                <p className="text-center text-gray-400 text-xs mt-4">
                  *Pesanan akan otomatis masuk ke riwayat transaksi setelah diklik.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Cart;