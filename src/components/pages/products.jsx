import images from './shoes-1.jpg';
import React, { Fragment, useEffect, useState, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase"; 
import { collection, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { AuthProvider } from "../../../context/AuthContext";
import AdminRoute from '../../../middleware/AdminRoute';



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
          e.target.src =
            "https://placehold.co/400x300/e0e7ff/3730a3?text=No+Image";
        }}
      />
    </div>
  );
};

const Body = ({ children, title }) => {
  return (
    <div className="px-4 sm:px-5 pb-3 sm:pb-5 flex flex-col justify-between flex-grow">
      <a href="#" className="group">
        <h5 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">{title}</h5>
      </a>
      <p className="text-xs sm:text-sm text-gray-700 line-clamp-3 leading-relaxed">{children}</p>
    </div>
  );
};

const Footer = ({ price, handleAddToCart, id, handleDeleteProduct }) => {
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
      <div className="flex gap-2">
        <button
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-xs sm:text-sm py-2.5 px-3 transition-all duration-300 shadow-md hover:shadow-lg border-2 border-red-600 hover:border-red-700 transform hover:-translate-y-0.5"
          onClick={() => handleDeleteProduct(id)}
        >
          🗑️ Hapus
        </button>
  
      </div>
    </div>
  );
};

const getUserId = () => {
    const storedUserId = localStorage.getItem("user_id");
    return storedUserId ? parseInt(storedUserId) : 1; 
};

const Product = () => {
  const [userEmail, setUserEmail] = useState(localStorage.getItem("email") || "Guest");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    image: ""
  });

  const navigate = useNavigate();


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
  
  const handleSaveNewProduct = async () => {
  try {
    const newProduct = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      image: form.image || images,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "barang"), newProduct);

    setProducts(prev => [...prev, { id: docRef.id, ...newProduct }]);
    setShowAddModal(false);
    setForm({ title: "", description: "", price: "", image: "" });

    alert("Produk berhasil ditambahkan!");
  } catch (err) {
    alert("Gagal menambahkan produk: " + err.message);
  }
};

  
  const handleLogout = () => {
    localStorage.removeItem("email");
    localStorage.removeItem("password");
    localStorage.removeItem("user_id");
    setUserEmail("Guest");
    window.location.replace("/login");
  };

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

  const handleAddProduct = () => {
      navigate("/products/add");
  };
  
  const handleDeleteProduct = async (id) => {
    try {
      const confirmDelete = window.prompt("Ketik 'HAPUS' untuk mengonfirmasi penghapusan produk ID: " + id);
      if (!confirmDelete || confirmDelete.toUpperCase() !== "HAPUS") return;
  
      await deleteDoc(doc(db, "barang", id));
  
      setProducts((prev) => prev.filter((p) => p.id !== id));
      alert("Produk berhasil dihapus dari Firestore!");
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus produk: " + err.message);
    }
  };
  

  const handleClearCart = () => {
       if (cart.length > 0) {
        const confirmation = window.prompt("Ketik 'HAPUS' untuk mengonfirmasi penghapusan semua item di keranjang:");
        if (confirmation && confirmation.toUpperCase() === 'HAPUS') {
            setCart([]);
        } else if (confirmation !== null) {
            window.alert("Penghapusan dibatalkan.");
        }
      } else {
          window.alert("Keranjang sudah kosong.");
       }
  };

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

    // Simpan transaksi ke Firestore
    const docRef = await addDoc(collection(db, "riwayat"), {
      userEmail,
      userId: getUserId(),
      items: itemsSnapshot,
      total,
      status: "Menunggu Pembayaran",
      createdAt: serverTimestamp()
    });

    setCart([]);

    // Redirect ke halaman payment
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
    
  const total = useMemo(() => {
    return cart.reduce((acc, item) => {
      const prod = products.find((p) => p.id === item.id);
      if (prod) {
        return acc + prod.price * item.qty;
      }
      return acc;
    }, 0);
  }, [cart, products]);

  return (
    <AuthProvider>
    <AdminRoute>
    <Fragment>
      {/* Header dengan gradien dan shadow yang lebih baik */}
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
          </div>
          
          <Button className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm" onClick={handleLogout}>
              🚪 Logout
          </Button>
        </div>
      </header>

      {/* Background pattern subtle */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100">
        <div className="flex flex-col lg:flex-row justify-center py-6 sm:py-8 px-3 sm:px-4 gap-6">
          {/* Bagian produk */}
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
          <div
  onClick={() => setShowAddModal(true)}
  className="cursor-pointer flex flex-col items-center justify-center bg-white border-2 border-dashed border-blue-400 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 p-6"
>
  <div className="text-5xl text-blue-600 mb-3">➕</div>
  <p className="font-bold text-blue-700 text-lg">Tambah Produk</p>
  <span className="text-sm text-gray-500">Klik untuk membuka form</span>
</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {!isLoading && !error && products.length > 0 && products.map((product, index) => (
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
                  <Body title={product.title}>
                    {product.description || "Deskripsi produk tidak tersedia."}
                  </Body>
                  <Footer 
                    price={product.price} 
                    handleAddToCart={handleAddToCart}
                    handleDeleteProduct={handleDeleteProduct}
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

          {/* Bagian cart - Desktop dengan desain lebih menarik */}
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

          {/* Bagian cart - Mobile (Sidebar) dengan animasi slide */}
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

      {/* CSS Animations */}
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
      {showAddModal && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
      <h2 className="text-xl font-bold mb-4">➕ Tambah Produk Baru</h2>

      <input
        className="w-full border p-2 rounded mb-3"
        placeholder="Nama Produk"
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
      />

      <input
        type="number"
        className="w-full border p-2 rounded mb-3"
        placeholder="Harga"
        value={form.price}
        onChange={e => setForm({ ...form, price: e.target.value })}
      />

      <textarea
        className="w-full border p-2 rounded mb-3"
        placeholder="Deskripsi"
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
      />

      <input
        className="w-full border p-2 rounded mb-4"
        placeholder="URL Gambar (opsional)"
        value={form.image}
        onChange={e => setForm({ ...form, image: e.target.value })}
      />

      <div className="flex gap-2">
        <Button className="bg-gray-400" onClick={() => setShowAddModal(false)}>
          Batal
        </Button>
        <Button className="bg-blue-600" onClick={handleSaveNewProduct}>
          Simpan
        </Button>
      </div>
    </div>
  </div>
)}

    </Fragment>
    </AdminRoute>
    </AuthProvider>
  );
};

export default Product;