import { Fragment, useEffect, useState } from "react";
import Button from "../Elements/Button/button";
import CardProduct from "../Fragments/CardProduct";

const email = localStorage.getItem("email");

const Product = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  // Ambil data dari backend
  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("email");
    localStorage.removeItem("password");
    window.location.href = "/login";
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

  return (
    <Fragment>
      <div className="flex justify-end gap-x-6 h-20 bg-blue-600 text-white items-center px-10">
        {email}
        <Button className="ml-5 bg-black" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="flex justify-center py-5">
        {/* Bagian produk */}
        <div className="w-3/4 flex flex-wrap gap-5">
          {products.map((p) => (
            <CardProduct key={p.id}>
              <CardProduct.Header images={p.image} />
              <CardProduct.Body title={p.title}>
                {p.description}
              </CardProduct.Body>
              <CardProduct.Footer
                price={p.price}
                handleAddToCart={handleAddToCart}
                id={p.id}
              />
            </CardProduct>
          ))}
        </div>

        {/* Bagian cart */}
        <div className="w-1/4 px-5">
          <h1 className="text-3xl font-bold text-blue-600">Cart</h1>
          <ul className="mt-4">
            {cart.map((item) => {
              const prod = products.find((p) => p.id === item.id);
              return (
                <li key={item.id} className="mb-2">
                  {prod?.title} - Qty: {item.qty}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Fragment>
  );
};

export default Product;
