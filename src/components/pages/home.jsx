import React, { Fragment, useEffect, useState, useMemo, useRef } from 'react';
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
      className={`px-6 py-3 font-semibold rounded-full text-white ${className} hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${disabled ? 'opacity-50 cursor-not-allowed hover:transform-none' : ''} text-sm md:text-base`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const ProductCard = ({ product, onClick, onAddToCart }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 mx-2 min-w-[280px] max-w-[300px]">
      <div className="overflow-hidden rounded-t-2xl cursor-pointer" onClick={onClick}>
        <img
          src={product.image || "https://placehold.co/400x300/e0e7ff/3730a3?text=No+Image"}
          alt={product.title}
          className="w-full h-48 object-cover transition-transform duration-700 hover:scale-110"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co/400x300/e0e7ff/3730a3?text=No+Image";
          }}
        />
      </div>
      
      <div className="p-5">
        <div className="mb-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-600">
            {product.merk || "Brand"}
          </span>
        </div>
        
        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">{product.title}</h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description || "No description available"}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(product.price)}
          </span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product.id);
            }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg"
          >
            🛒 Add
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// --- MAIN COMPONENT ---
// =========================================================================
const ProductUser = () => {
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);

  const [userEmail, setUserEmail] = useState(localStorage.getItem("email") || "Guest");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [cartNotification, setCartNotification] = useState(false);

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

  // ================= AUTOSCROLL CAROUSEL =================
  useEffect(() => {
    if (!autoScroll || products.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % filteredProducts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [autoScroll, products.length]);

  // ================= LOGOUT =================
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    window.location.replace("/login");
  };

  // ================= LOGIN =================
  const handleLogin = () => {
    navigate("/login");
  };

  // ================= SHOP NAVIGATION =================
  const handleShopClick = () => {
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // ================= FILTER PRODUK =================
  const filteredProducts = useMemo(() => {
    if (activeCategory === "all") return products;
    return products.filter(product => 
      product.merk?.toLowerCase().includes(activeCategory) || 
      product.title?.toLowerCase().includes(activeCategory)
    );
  }, [products, activeCategory]);

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

    // Show notification
    setCartNotification(true);
    setTimeout(() => setCartNotification(false), 2000);
  };

  const totalItems = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.qty, 0);
  }, [cart]);

  const categories = [
    { id: "all", label: "All Products", emoji: "✨" },
    { id: "shoes", label: "Shoes", emoji: "👟" },
    { id: "shirt", label: "Shirts", emoji: "👕" },
    { id: "pants", label: "Pants", emoji: "👖" },
    { id: "accessories", label: "Accessories", emoji: "🧢" }
  ];

  const brands = [
    {
      name: "Nike",
      description: "Just Do It. Innovation and inspiration for every athlete in the world.",
      color: "from-red-500 to-orange-500",
      logo: "✔️"
    },
    {
      name: "Adidas",
      description: "Impossible is Nothing. Creating the future of sport through creativity.",
      color: "from-black to-gray-800",
      logo: "🌀"
    },
    {
      name: "Puma",
      description: "Forever Faster. Always first to bring fashion to sport.",
      color: "from-red-700 to-red-500",
      logo: "🐆"
    },
    {
      name: "Reebok",
      description: "Be More Human. Fitness and lifestyle brand with heritage.",
      color: "from-blue-500 to-blue-700",
      logo: "⚡"
    }
  ];

  // Fungsi untuk navigasi category
  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    // Scroll ke products section
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Cek apakah user sudah login atau masih guest
  const isLoggedIn = userEmail !== "Guest";

  return (
    <AuthProvider>
      <NotAdminRoute>
        <Fragment>
          {/* ================= HEADER ESTETIK DENGAN BACKGROUND GAMBAR SEPATU ================= */}
          <div className="relative overflow-hidden text-white min-h-screen flex flex-col">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
                alt="Shoes Background"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 via-purple-900/60 to-indigo-900/70"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40"></div>
            </div>

            {/* Geometric Pattern Overlay */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/4 left-10 w-32 h-32 bg-gradient-to-br from-blue-400 to-transparent rounded-full filter blur-2xl"></div>
              <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-gradient-to-tl from-purple-500 to-transparent rounded-full filter blur-2xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-tr from-cyan-400 to-transparent rounded-full filter blur-3xl"></div>
            </div>

            {/* Shoe Silhouettes */}
            <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10">
              <div className="absolute bottom-0 left-10 w-64 h-32 bg-gradient-to-t from-white to-transparent clip-path-shoe"></div>
              <div className="absolute bottom-0 right-10 w-56 h-28 bg-gradient-to-t from-white to-transparent clip-path-shoe rotate-12"></div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-24 bg-gradient-to-t from-white to-transparent clip-path-shoe -rotate-6"></div>
            </div>

            <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col justify-center">
              {/* Top Navigation */}
              <div className="flex flex-col md:flex-row justify-between items-center mb-12 mx-auto max-w-7xl w-full">
                <div className="mb-6 md:mb-0">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 bg-gradient-to-r from-white via-white-200 to-white-200 bg-clip-text text-transparent drop-shadow-lg">
                    Gate
                  </h1>
                  <p className="text-cyan-100 font-medium drop-shadow-md text-lg">Your Gateway to Premium Fashion</p>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Shop Button */}
                  <button 
                    onClick={handleShopClick}
                    className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 backdrop-blur-sm border border-cyan-400/30 shadow-lg"
                  >
                    <span>🛍️</span>
                    <span className="font-medium">Shop Now</span>
                  </button>

                  <button 
                    onClick={() => navigate("/transactions")}
                    className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg"
                  >
                    <span>📋</span>
                    <span className="font-medium">History</span>
                  </button>
                  
                  <button 
                    onClick={() => navigate("/account")}
                    className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg"
                  >
                    <span>👤</span>
                    <span className="font-medium truncate max-w-[120px]">{userEmail.split('@')[0] || "Guest"}</span>
                  </button>
                  
                  {/* Conditional Login/Logout Button */}
                  {isLoggedIn ? (
                    <button 
                      onClick={handleLogout}
                      className="px-4 py-2 rounded-full bg-red-500/30 hover:bg-red-500/40 border border-red-400/40 transition-all duration-300 backdrop-blur-sm shadow-lg"
                    >
                      Logout
                    </button>
                  ) : (
                    <button 
                      onClick={handleLogin}
                      className="px-4 py-2 rounded-full bg-green-500/30 hover:bg-green-500/40 border border-green-400/40 transition-all duration-300 backdrop-blur-sm shadow-lg"
                    >
                      Login
                    </button>
                  )}
                </div>
              </div>

              {/* Main Navigation Tabs */}
              <div className="flex justify-center mb-8 px-4">
                <div className="inline-flex rounded-2xl bg-black/30 backdrop-blur-xl p-1 border border-white/20 shadow-2xl">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      className={`px-4 sm:px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 ${activeCategory === category.id 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' 
                        : 'text-white hover:bg-white/15'}`}
                    >
                      <span className="text-xl">{category.emoji}</span>
                      <span className="font-semibold text-sm sm:text-base">{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hero Text */}
              <div className="text-center mb-8 px-4 sm:px-6">
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 drop-shadow-2xl px-2">
                  Enter the <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">Gateway</span>
                </h2>
                <p className="text-lg sm:text-xl text-cyan-100 max-w-4xl mx-auto leading-relaxed drop-shadow-md px-4">
                  Your portal to exclusive fashion finds. Discover curated collections that redefine style and elevate your wardrobe.
                </p>
              </div>

              {/* Stats with Icons */}
              <div className="flex justify-center space-x-6 sm:space-x-8 md:space-x-12 mt-12 px-4">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">{products.length || "500+"}</div>
                  <div className="text-cyan-100 flex items-center justify-center space-x-2 text-sm sm:text-base">
                    <span>👕</span>
                    <span>Products</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-300 to-purple-400 bg-clip-text text-transparent">50+</div>
                  <div className="text-cyan-100 flex items-center justify-center space-x-2 text-sm sm:text-base">
                    <span>🏆</span>
                    <span>Brands</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-400 bg-clip-text text-transparent">24/7</div>
                  <div className="text-cyan-100 flex items-center justify-center space-x-2 text-sm sm:text-base">
                    <span>🚪</span>
                    <span>Always Open</span>
                  </div>
                </div>
              </div>

              {/* Scroll Indicator */}
              <div className="mt-16 flex justify-center">
                <div className="animate-bounce cursor-pointer" onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  <svg className="w-10 h-10 text-white/80 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ================= BRAND INTRODUCTION ================= */}
          <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
            <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold mb-4">
                  Behind the Gate
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
                  Curated <span className="text-blue-600">Collections</span>
                </h2>
                <p className="text-gray-600 text-base sm:text-lg max-w-3xl mx-auto">
                  Step through our gate to discover handpicked selections from the world's most prestigious fashion houses
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {brands.map((brand, index) => (
                  <div 
                    key={brand.name}
                    className={`bg-gradient-to-br ${brand.color} rounded-2xl p-4 sm:p-6 text-white transform transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="text-3xl sm:text-4xl">{brand.logo}</div>
                      <div className="text-xl sm:text-2xl font-bold">{brand.name}</div>
                    </div>
                    <p className="text-white/90 text-xs sm:text-sm mb-4">{brand.description}</p>
                    <button 
                      onClick={() => {
                        setActiveCategory(brand.name.toLowerCase());
                        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="mt-4 px-3 sm:px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 text-sm"
                    >
                      Shop {brand.name} →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ================= PRODUCTS CAROUSEL ================= */}
          <section id="products-section" className="py-16 bg-gradient-to-b from-white to-gray-50">
            <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
                  Beyond the <span className="text-blue-600">Gate</span>
                </h2>
                <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-4">
                  Discover what awaits you behind the gate - exclusive finds and limited editions
                </p>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md max-w-2xl mx-auto">
                  <p className="text-red-700 font-medium">⚠️ {error}</p>
                </div>
              ) : (
                <div className="relative px-2 sm:px-4">
                  {/* Carousel Container */}
                  <div 
                    ref={carouselRef}
                    className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-8 px-2 sm:px-4"
                    onMouseEnter={() => setAutoScroll(false)}
                    onMouseLeave={() => setAutoScroll(true)}
                  >
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="flex-shrink-0 snap-center px-2">
                        <ProductCard
                          product={product}
                          onClick={() => navigate(`/products/${product.id}`)}
                          onAddToCart={handleAddToCart}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Navigation Dots */}
                  <div className="flex justify-center space-x-2 mt-8">
                    {filteredProducts.slice(0, Math.min(5, filteredProducts.length)).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentIndex(index);
                          carouselRef.current?.scrollTo({
                            left: index * 320,
                            behavior: 'smooth'
                          });
                        }}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-blue-600 w-8' : 'bg-gray-300 hover:bg-gray-400'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ================= CART NOTIFICATION ================= */}
          {cartNotification && (
            <div className="fixed bottom-4 right-4 z-50 animate-slideInUp">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3">
                <span className="text-2xl">🛒</span>
                <div>
                  <div className="font-bold">Added to Cart!</div>
                  <div className="text-sm opacity-90">Item successfully added to your shopping cart</div>
                </div>
              </div>
            </div>
          )}

          {/* Cart Floating Button */}
          <button
            onClick={() => navigate("/cart")}
            className="fixed bottom-8 right-8 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 group"
          >
            <div className="relative">
              <span className="text-2xl">🛒</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                  {totalItems}
                </span>
              )}
            </div>
          </button>

          {/* ================= FOOTER ================= */}
          <footer className="bg-gradient-to-r from-gray-900 to-blue-900 text-white py-12">
            <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                    🚪 GATE
                  </h1>
                  <p className="text-gray-400 text-sm sm:text-base">Your gateway to premium fashion and exclusive finds.</p>
                </div>
                <div>
                  <h4 className="font-bold mb-4 text-sm sm:text-base">Categories</h4>
                  <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                    {categories.slice(1).map(cat => (
                      <li key={cat.id} className="cursor-pointer hover:text-white" onClick={() => handleCategoryClick(cat.id)}>
                        {cat.emoji} {cat.label}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-4 text-sm sm:text-base">Brands</h4>
                  <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                    {brands.map(brand => (
                      <li key={brand.name} className="cursor-pointer hover:text-white" onClick={() => {
                        setActiveCategory(brand.name.toLowerCase());
                        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}>
                        {brand.logo} {brand.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-4 text-sm sm:text-base">Account</h4>
                  <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                    <li className="cursor-pointer hover:text-white" onClick={() => navigate("/account")}>Profile</li>
                    <li className="cursor-pointer hover:text-white" onClick={() => navigate("/transactions")}>Order History</li>
                    <li className="cursor-pointer hover:text-white">Wishlist</li>
                    <li className="cursor-pointer hover:text-white">Settings</li>
                  </ul>
                </div>
              </div>
              
              <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
                <p className="text-sm sm:text-base">© 2024 GATE. All rights reserved.</p>
                <p className="text-xs sm:text-sm mt-2">Your portal to fashion excellence</p>
              </div>
            </div>
          </footer>

          {/* ================= CSS ANIMATIONS ================= */}
          <style jsx>{`
            @keyframes slideInUp {
              from {
                transform: translateY(100px);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }

            .animate-slideInUp {
              animation: slideInUp 0.5s ease-out;
            }

            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }

            .snap-x {
              scroll-snap-type: x mandatory;
            }

            .snap-center {
              scroll-snap-align: center;
            }

            .clip-path-shoe {
              clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
            }
          `}</style>
        </Fragment>
      </NotAdminRoute>
    </AuthProvider>
  );
};

export default ProductUser;