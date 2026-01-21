const CART_KEY = "cart";

export const getCart = () => {
  const cart = localStorage.getItem("cart");
  return cart ? JSON.parse(cart) : [];
};

export const saveCart = (cart) => {
  localStorage.setItem("cart", JSON.stringify(cart));
  // Memicu event agar komponen lain tahu ada perubahan storage
  window.dispatchEvent(new Event("storage_updated"));
};

export const addToCart = (product) => {
  const cart = getCart();
  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    const updatedCart = cart.map((item) =>
      item.id === product.id ? { ...item, qty: item.qty + 1 } : item
    );
    saveCart(updatedCart);
  } else {
    cart.push({ ...product, qty: 1 });
    saveCart(cart);
  }
};



export const updateQty = (id, action) => {
  let cart = getCart();
  cart = cart.map(item => {
    if (item.id === id) {
      const newQty = action === 'add' ? item.qty + 1 : item.qty - 1;
      return { ...item, qty: Math.max(0, newQty) }; // Minimal 0
    }
    return item;
  }).filter(item => item.qty > 0); // Jika 0, hapus dari keranjang
  
  saveCart(cart);
};

export const removeFromCart = (id) => {
  const cart = getCart().filter(item => item.id !== id);
  saveCart(cart);
};

export const getCartCount = () => {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.qty, 0);
};

export const clearCart = () => {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event("cartUpdated"));
};