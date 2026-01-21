import images from './shoes-1.jpg';
import React, { Fragment, useEffect, useState, useMemo } from 'react';
import { useNavigate } from "react-router-dom";

import { db, auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

import { AuthProvider } from '../../../context/AuthContext';
import NotAdminRoute from '../../../middleware/NotAdminRoute';

// =========================================================================
// --- DEFINISI KOMPONEN PEMBANTU ---
// =========================================================================

const Button = ({ children, className = "bg-blue-600", onClick, type = "button", disabled = false }) => {
  return (
    <button
      type={type}
      className={`px-4 py-2 font-semibold rounded-lg text-white ${className} hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${disabled ? 'opacity-50 cursor-not-allowed hover:transform-none' : ''} text-sm md:text-base`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Header = ({ images, onClick }) => {
  return (
    <div
      className="group block overflow-hidden rounded-t-xl cursor-pointer"
      onClick={onClick}
    >
      <img
        src={images}
        alt="product"
        className="p-3 sm:p-4 rounded-t-xl object-cover w-full h-40 sm:h-48 transition-transform duration-500 group-hover:scale-110"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://placehold.co/400x300/e0e7ff/3730a3?text=No+Image";
        }}
      />
    </div>
  );
};

const Body = ({ children, title, merk }) => {
  return (
    <div className="px-4 sm:px-5 pb-3 sm:pb-5 flex flex-col justify-between flex-grow">
      <a href="#" className="group">
        <h5 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
          {title}
        </h5>
      </a>
      {merk && (
        <span className="text-xs sm:text-sm text-gray-500 mb-2">
          Merk: {merk}
        </span>
      )}
      <p className="text-xs sm:text-sm text-gray-700 line-clamp-3 leading-relaxed">
        {children}
      </p>
    </div>
  );
};

const Footer = ({ price, handleAddToCart, id }) => {
  const formatPrice = (p) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(p);

  return (
    <div className="flex flex-col gap-3 px-4 sm:px-5 pb-4 sm:pb-5 pt-2 sm:pt-3">
      <span className="text-lg sm:text-2xl font-bold text-gray-900 text-center sm:text-left bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
        {formatPrice(price)}
      </span>

      <button
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs sm:text-sm py-2.5 px-3 transition-all duration-300 shadow-md hover:shadow-lg border-2 border-blue-700 hover:border-blue-800 transform hover:-translate-y-0.5"
        onClick={(e) => {
          e.stopPropagation();
          handleAddToCart(id);
        }}
      >
        🛒 Keranjang
      </button>
    </div>
  );
};

// =========================================================================
// --- UTIL USER ---
// =========================================================================
const getUserId = () => {
  const storedUserId = localStorage.getItem("user_id");
  return storedUserId ? parseInt(storedUserId) : 1;
};

// =========================================================================
// --- MAIN COMPONENT ---
// =========================================================================
const ProductUser = () => {
  const navigate = useNavigate();

  const [userEmail, setUserEmail] = useState(localStorage.getItem("email") || "Guest");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [filterMerk, setFilterMerk] = useState("");

  // ================= FETCH PRODUK =================
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const querySnapshot = await getDocs(collection(db, "barang"));
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(data);
      } catch (err) {
        console.error(err);
        setError("Gagal mengambil data dari Firebase");
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  // ================= LOGOUT AMAN =================
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    window.location.replace("/login");
  };

  // ================= FILTER MERK =================
  const filteredProducts = products.filter(p =>
    !filterMerk || p.merk === filterMerk
  );

  // ================= CART =================
  const handleAddToCart = (id) => {
    const productInCart = cart.find((item) => item.id === id);

    if (productInCart) {
      setCart(
        cart.map((item) =>
          item.id === id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      setCart([...cart, { id, qty: 1 }]);
    }
  };

  const handleClearCart = () => {
    if (cart.length > 0) {
      const confirmation = window.prompt("Ketik 'HAPUS' untuk mengonfirmasi penghapusan semua item:");
      if (confirmation && confirmation.toUpperCase() === 'HAPUS') {
        setCart([]);
      }
    }
  };

  const total = useMemo(() => {
    return cart.reduce((acc, item) => {
      const prod = products.find((p) => p.id === item.id);
      if (prod) return acc + prod.price * item.qty;
      return acc;
    }, 0);
  }, [cart, products]);

  // ================= CHECKOUT =================
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Keranjang kosong");
      return;
    }

    setIsCheckingOut(true);

    try {
      const itemsSnapshot = cart.map(item => {
        const prod = products.find(p => p.id === item.id);
        return {
          productId: item.id,
          title: prod?.title,
          price: prod?.price,
          qty: item.qty
        };
      });

      const docRef = await addDoc(collection(db, "riwayat"), {
        userEmail,
        userId: getUserId(),
        items: itemsSnapshot,
        total,
        status: "Menunggu Pembayaran",
        createdAt: serverTimestamp()
      });

      setCart([]);
      navigate(`/payment/${docRef.id}`);

    } catch (err) {
      console.error(err);
      alert("Checkout gagal");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const formatPrice = (p) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(p);

  // ================= RENDER =================
  return (
    <AuthProvider>
      <NotAdminRoute>
        <Fragment>
          {/* ================= HEADER IMPROVED ================= */}
          <header className="flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white px-4 py-4 sm:px-6 md:px-10 shadow-2xl gap-3 sm:gap-4 sticky top-0 z-40 backdrop-blur-sm">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight drop-shadow-lg">
              🏪 Toko Produk
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm whitespace-nowrap" 
                onClick={() => navigate("/transactions")}
              >
                📋 Riwayat Transaksi
              </Button>
              
              {/* Tombol Cart Mobile dengan badge */}
              <Button 
                className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm lg:hidden relative"
                onClick={() => setShowCart(!showCart)}
              >
                🛒 Keranjang ({cart.length})
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse shadow-lg">
                    {cart.length}
                  </span>
                )}
              </Button>

              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                <span className="font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-[150px] md:max-w-xs">
                  👤 {userEmail}
                </span>
                <Button className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm" onClick={handleLogout}>
                  🚪 Logout
                </Button>
              </div>
            </div>
          </header>

          {/* ================= BACKGROUND ================= */}
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100">
            <div className="flex flex-col lg:flex-row justify-center py-6 sm:py-8 px-3 sm:px-4 gap-6">
              {/* ================= PRODUK SECTION ================= */}
              <div className="w-full lg:w-3/4">
                {isLoading && (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md">
                    <p className="text-red-700 font-medium">⚠️ {error}</p>
                  </div>
                )}

                {/* ================= FILTER MERK IMPROVED ================= */}
                <div className="flex flex-wrap gap-2 p-4 mb-4">
                  {["", "Nike", "Adidas", "Puma", "Reebok"].map((merk) => (
                    <button
                      key={merk || "all"}
                      onClick={() => setFilterMerk(merk)}
                      className={`px-3 py-1 rounded-lg font-medium text-sm transition-colors duration-300
                        ${filterMerk === merk ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-blue-400 hover:text-white"}`}
                    >
                      {merk || "Semua"}
                    </button>
                  ))}
                </div>

                {/* ================= GRID PRODUK IMPROVED ================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-4">
                  {!isLoading && !error && filteredProducts.length > 0 && filteredProducts.map((product, index) => (
                    <div
                      key={product.id}
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="w-full bg-white border border-gray-200 rounded-xl shadow-lg cursor-pointer
                                hover:shadow-2xl flex flex-col justify-between transform transition-all
                                duration-500 hover:scale-105 hover:-rotate-1 animate-fadeIn"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <Header
                        images={product.image || images}
                        onClick={() => navigate(`/products/${product.id}`)}
                      />
                      <Body title={product.title} merk={product.merk}>
                        {product.description || "Deskripsi produk tidak tersedia."}
                      </Body>
                      <Footer 
                        price={product.price} 
                        handleAddToCart={handleAddToCart}
                        id={product.id}
                      />
                    </div>
                  ))}

                  {!isLoading && !error && products.length === 0 && (
                    <div className="col-span-full">
                      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-gray-500 text-xl font-medium">
                          Database Anda kosong atau tidak ada produk.
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                          Tambahkan produk untuk memulai!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ================= CART DESKTOP IMPROVED ================= */}
              <div className="hidden lg:block w-full lg:w-1/4 lg:sticky lg:top-24 lg:self-start px-3 sm:px-5">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-blue-100">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                      🛒 Keranjang Belanja
                      {cart.length > 0 && (
                        <span className="bg-white text-blue-600 text-sm px-3 py-1 rounded-full font-bold">
                          {cart.length}
                        </span>
                      )}
                    </h1>
                  </div>
                  
                  <div className="p-4">
                    <ul className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {cart.length > 0 ? (
                        cart.map((item, index) => {
                          const prod = products.find((p) => p.id === item.id);
                          if (!prod) return null;
                          return (
                            <li 
                              key={item.id} 
                              className="py-3 flex justify-between items-center hover:bg-blue-50 px-2 rounded-lg transition-all duration-300 animate-slideIn"
                              style={{ animationDelay: `${index * 0.05}s` }}
                            >
                              <div className="flex-1">
                                <span className="font-semibold text-gray-800 text-sm block">
                                  {prod.title}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatPrice(prod.price)} × {item.qty}
                                </span>
                              </div>
                              <span className="font-bold text-blue-600 text-base ml-2">
                                {formatPrice(prod.price * item.qty)}
                              </span>
                            </li>
                          );
                        })
                      ) : (
                        <li className="text-gray-400 text-center py-12">
                          <div className="text-4xl mb-3">🛍️</div>
                          <p className="text-sm">Keranjang kosong</p>
                          <p className="text-xs mt-1">Tambahkan produk!</p>
                        </li>
                      )}
                    </ul>
                    
                    <div className="pt-4 mt-4 border-t-2 border-blue-100">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-700 text-lg">Total:</span>
                          <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                            {formatPrice(total)}
                          </span>
                        </div>
                      </div>
                      
                      <Button 
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 w-full mb-3" 
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || isCheckingOut}
                      >
                        {isCheckingOut ? '⏳ Memproses...' : '💳 Checkout & Bayar'}
                      </Button>
                      
                      <Button 
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 w-full" 
                        onClick={handleClearCart}
                        disabled={cart.length === 0 || isCheckingOut}
                      >
                        🗑️ Hapus Pesanan ({cart.length})
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= CART MOBILE IMPROVED ================= */}
              {showCart && (
                <div 
                  className="lg:hidden fixed inset-0 bg-black bg-opacity-60 z-50 animate-fadeIn backdrop-blur-sm" 
                  onClick={() => setShowCart(false)}
                >
                  <div 
                    className="absolute right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl overflow-y-auto animate-slideInRight"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 flex justify-between items-center shadow-lg z-10">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        🛒 Keranjang
                        {cart.length > 0 && (
                          <span className="bg-white text-blue-600 text-sm px-3 py-1 rounded-full font-bold">
                            {cart.length}
                          </span>
                        )}
                      </h2>
                      <button 
                        onClick={() => setShowCart(false)}
                        className="text-3xl font-bold hover:text-gray-200 transition-transform hover:rotate-90 duration-300"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="p-4">
                      <ul className="divide-y divide-gray-100 mb-4">
                        {cart.length > 0 ? (
                          cart.map((item, index) => {
                            const prod = products.find((p) => p.id === item.id);
                            if (!prod) return null;
                            return (
                              <li 
                                key={item.id} 
                                className="py-4 flex justify-between items-center hover:bg-blue-50 px-2 rounded-lg transition-all duration-300"
                              >
                                <div className="flex-1">
                                  <span className="font-semibold text-gray-800 block">
                                    {prod.title}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {formatPrice(prod.price)} × {item.qty}
                                  </span>
                                </div>
                                <span className="font-bold text-blue-600 text-lg ml-2">
                                  {formatPrice(prod.price * item.qty)}
                                </span>
                              </li>
                            );
                          })
                        ) : (
                          <li className="text-gray-400 text-center py-16">
                            <div className="text-5xl mb-4">🛍️</div>
                            <p>Keranjang kosong</p>
                            <p className="text-sm mt-2">Tambahkan produk!</p>
                          </li>
                        )}
                      </ul>
                      
                      <div className="pt-4 border-t-2 border-blue-100">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-700 text-lg">Total:</span>
                            <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                              {formatPrice(total)}
                            </span>
                          </div>
                        </div>
                        
                        <Button 
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 w-full mb-3" 
                          onClick={() => {
                            handleCheckout();
                            setShowCart(false);
                          }}
                          disabled={cart.length === 0 || isCheckingOut}
                        >
                          {isCheckingOut ? '⏳ Memproses...' : '💳 Checkout & Bayar'}
                        </Button>
                        
                        <Button 
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 w-full" 
                          onClick={handleClearCart}
                          disabled={cart.length === 0 || isCheckingOut}
                        >
                          🗑️ Hapus Pesanan ({cart.length})
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ================= CSS ANIMATIONS ================= */}
          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes slideInRight {
              from {
                transform: translateX(100%);
              }
              to {
                transform: translateX(0);
              }
            }

            .animate-fadeIn {
              animation: fadeIn 0.6s ease-out forwards;
              opacity: 0;
            }

            .animate-slideIn {
              animation: slideIn 0.4s ease-out forwards;
              opacity: 0;
            }

            .animate-slideInRight {
              animation: slideInRight 0.4s ease-out;
            }

            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }

            .custom-scrollbar::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 10px;
            }

            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #3b82f6;
              border-radius: 10px;
            }

            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #2563eb;
            }
          `}</style>
        </Fragment>
      </NotAdminRoute>
    </AuthProvider>
  );
};

export default ProductUser;