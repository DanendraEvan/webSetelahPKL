import React, { Fragment, useEffect, useState, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase"; 
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";



// =========================================================================
// --- DEFINISI KOMPONEN PEMBANTU ---
// =========================================================================
const Button = ({ children, className = "bg-blue-600", onClick, type = "button", disabled = false }) => {
  return (
    <button
      type={type}
      className={`px-4 py-2 font-semibold rounded-lg text-white ${className} hover:opacity-90 transition duration-200 shadow-md ${disabled ? 'opacity-50 cursor-not-allowed' : ''} text-sm md:text-base`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const CardProduct = (props) => {
  const { children, isAddButton = false } = props;
  
  if (isAddButton) {
      return (
          <div 
              className="w-full bg-gray-100 border-2 border-dashed border-gray-400 rounded-xl shadow-inner flex flex-col items-center justify-center p-4 sm:p-6 cursor-pointer hover:bg-gray-200 transition duration-300 h-[300px] sm:h-[350px]"
              onClick={props.onClick}
          >
              {children}
          </div>
      );
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col justify-between transform transition duration-300 hover:scale-[1.02]">
      {children}
    </div>
  );
};

const Header = ({ images }) => {
  return (
    <a href="#">
      <img
        src={images}
        alt="product"
        className="p-3 sm:p-4 rounded-t-xl object-cover w-full h-40 sm:h-48"
        onError={(e) => {
            e.target.onerror = null; 
            e.target.src="https://placehold.co/400x300/e0e7ff/3730a3?text=No+Image";
        }}
      />
    </a>
  );
};

const Body = ({ children, title }) => {
  return (
    <div className="px-4 sm:px-5 pb-3 sm:pb-5 flex flex-col justify-between flex-grow">
      <a href="#">
        <h5 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 mb-2 line-clamp-2">{title}</h5>
      </a>
      <p className="text-xs sm:text-sm text-gray-700 line-clamp-3">{children}</p>
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
      <span className="text-lg sm:text-xl font-bold text-gray-900 text-center sm:text-left">{formatPrice(price)}</span>
      <div className="flex gap-2">
        <button
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-xs sm:text-sm py-2 px-3 transition duration-200 shadow-md border-2 border-red-600 hover:border-red-700"
          onClick={() => handleDeleteProduct(id)}
        >
          Hapus
        </button>
        <button
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs sm:text-sm py-2 px-3 transition duration-200 shadow-md border-2 border-blue-700 hover:border-blue-800"
          onClick={() => handleAddToCart(id)}
        >
          + Keranjang
        </button>
      </div>
    </div>
  );
};

CardProduct.Header = Header;
CardProduct.Body = Body;
CardProduct.Footer = Footer;

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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
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
        setError("Gagal memuat data dari Firestore");
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchProducts();
  }, []);
  

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
    if (confirmDelete && confirmDelete.toUpperCase() === 'HAPUS') {
        const res = await fetch(`http://localhost:5000/api/products/${id}`, {
            method: "DELETE",
        });

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

        setProducts((prev) => prev.filter((p) => p.id !== id));
        window.alert("Produk berhasil dihapus!");
    } else if (confirmDelete !== null) {
        window.alert("Penghapusan dibatalkan.");
    }
     } catch (err) {
    console.error("Error hapus:", err);
    window.alert("Gagal menghapus produk: " + err.message);
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
      window.alert("Keranjang belanja Anda kosong.");
      return;
    }

    setIsCheckingOut(true);
    
    const itemsSnapshot = cart.map(item => {
        const prod = products.find(p => p.id === item.id);
        return {
            product_id: item.id,
            title: prod ? prod.title : 'Produk tidak ditemukan',
            quantity: item.qty,
            price_at_order: prod ? prod.price : 0
        };
    });

    const checkoutData = {
      userId: getUserId(), 
      itemsSnapshot: itemsSnapshot, 
      total: total,
    };

    try {
      const res = await fetch("http://localhost:5000/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutData),
      });

      const data = await res.json();

      if (res.ok) {
        window.alert(`Pesanan berhasil dibuat! ID Transaksi: ${data.transactionId}. Lanjutkan ke pembayaran.`);
        setCart([]); 
        navigate(`/payment/${data.transactionId}`); 
      } else {
        window.alert(`Checkout Gagal: ${data.error || "Terjadi kesalahan server."}`);
      }

    } catch (error) {
      console.error("Checkout fetch error:", error);
      window.alert("Terjadi error koneksi saat checkout. Pastikan server berjalan!");
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
    <Fragment>
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center bg-blue-700 text-white px-4 py-3 sm:px-6 md:px-10 shadow-lg gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Toko Produk</h1>
        
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button 
              className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm whitespace-nowrap" 
              onClick={() => navigate("/transactions")}
          >
              Riwayat Transaksi
          </Button>
          
          {/* Tombol Cart Mobile */}
          <Button 
              className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm lg:hidden relative"
              onClick={() => setShowCart(!showCart)}
          >
              Keranjang ({cart.length})
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
          </Button>
          
          <span className="font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-[150px] md:max-w-xs">
              {userEmail}
          </span>
          <Button className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm" onClick={handleLogout}>
              Logout
          </Button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row justify-center py-3 sm:py-5 px-3 sm:px-4 gap-4">
        {/* Bagian produk */}
        <div className="w-full lg:w-3/4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Card Tambah Menu */}
            <CardProduct isAddButton onClick={handleAddProduct}>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="40" 
                    height="40" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-gray-600 mb-3"
                >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <p className="text-base sm:text-lg font-semibold text-gray-700 text-center">Tambah Produk Baru</p>
                <span className="text-xs sm:text-sm text-gray-500 mt-1 text-center">(Klik untuk membuka form)</span>
            </CardProduct>
            
            {isLoading && (
                <div className="col-span-full">
                  <p className="text-blue-600 text-lg sm:text-2xl mt-10 text-center">
                      Memuat produk dari server...
                  </p>
                </div>
            )}
            {error && (
                <div className="col-span-full">
                  <p className="text-red-500 text-base sm:text-xl mt-10 text-center p-4 border border-red-300 bg-red-50 rounded-lg">
                      {error}
                  </p>
                </div>
            )}

            {!isLoading && !error && products.length > 0 && products.map((p) => (
              <CardProduct key={p.id}>
                <CardProduct.Header images={p.image} />
                <CardProduct.Body title={p.title}>
                  {p.description}
                </CardProduct.Body>
                <CardProduct.Footer
                  price={p.price}
                  handleAddToCart={handleAddToCart}
                  handleDeleteProduct={handleDeleteProduct}
                  id={p.id}
                />
              </CardProduct>
            ))}
            {!isLoading && !error && products.length === 0 && (
                <div className="col-span-full">
                  <p className="text-gray-500 text-base sm:text-xl mt-10 text-center">
                      Database Anda kosong atau tidak ada produk.
                  </p>
                </div>
            )}
          </div>
        </div>

        {/* Bagian cart - Desktop */}
        <div className="hidden lg:block w-full lg:w-1/4 lg:sticky lg:top-8 lg:self-start px-3 sm:px-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 border-b-2 pb-2 mb-4">Keranjang Belanja</h1>
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg shadow-inner">
            <ul className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
              {cart.length > 0 ? (
                cart.map((item) => {
                  const prod = products.find((p) => p.id === item.id);
                  if (!prod) return null;
                  return (
                    <li key={item.id} className="py-2 flex justify-between items-center">
                      <span className="font-medium text-gray-800 text-sm sm:text-base">
                        {prod.title}
                        <span className="text-xs sm:text-sm text-gray-500 block">({formatPrice(prod.price)})</span>
                      </span>
                      <span className="font-semibold text-blue-600 text-sm sm:text-base">
                        {item.qty}x
                      </span>
                    </li>
                  );
                })
              ) : (
                <li className="text-gray-500 text-center py-4 text-sm sm:text-base">Keranjang kosong. Tambahkan produk!</li>
              )}
            </ul>
            
            <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t-2 border-blue-200">
                <div className="flex justify-between font-bold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">
                    <span>Total:</span>
                    <span>{formatPrice(total)}</span>
                </div>
                
                <Button 
                    className="bg-green-500 hover:bg-green-600 w-full mb-2" 
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || isCheckingOut}
                >
                    {isCheckingOut ? 'Memproses...' : 'Checkout & Bayar'}
                </Button>
                
                <Button 
                    className="bg-red-500 hover:bg-red-600 w-full" 
                    onClick={handleClearCart}
                    disabled={cart.length === 0 || isCheckingOut}
                >
                    Hapus Pesanan ({cart.length})
                </Button>
            </div>
          </div>
        </div>

        {/* Bagian cart - Mobile (Sidebar) */}
        {showCart && (
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowCart(false)}>
            <div 
              className="absolute right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-blue-600 text-white p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Keranjang Belanja</h2>
                <button 
                  onClick={() => setShowCart(false)}
                  className="text-2xl font-bold hover:text-gray-200"
                >
                  ×
                </button>
              </div>
              
              <div className="p-4">
                <ul className="divide-y divide-gray-200 mb-4">
                  {cart.length > 0 ? (
                    cart.map((item) => {
                      const prod = products.find((p) => p.id === item.id);
                      if (!prod) return null;
                      return (
                        <li key={item.id} className="py-3 flex justify-between items-center">
                          <span className="font-medium text-gray-800">
                            {prod.title}
                            <span className="text-sm text-gray-500 block">({formatPrice(prod.price)})</span>
                          </span>
                          <span className="font-semibold text-blue-600">
                            {item.qty}x
                          </span>
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-gray-500 text-center py-8">Keranjang kosong. Tambahkan produk!</li>
                  )}
                </ul>
                
                <div className="pt-4 border-t-2 border-blue-200">
                    <div className="flex justify-between font-bold text-lg text-gray-900 mb-4">
                        <span>Total:</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                    
                    <Button 
                        className="bg-green-500 hover:bg-green-600 w-full mb-2" 
                        onClick={() => {
                          handleCheckout();
                          setShowCart(false);
                        }}
                        disabled={cart.length === 0 || isCheckingOut}
                    >
                        {isCheckingOut ? 'Memproses...' : 'Checkout & Bayar'}
                    </Button>
                    
                    <Button 
                        className="bg-red-500 hover:bg-red-600 w-full" 
                        onClick={handleClearCart}
                        disabled={cart.length === 0 || isCheckingOut}
                    >
                        Hapus Pesanan ({cart.length})
                    </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Fragment>
  );
};

export default Product;