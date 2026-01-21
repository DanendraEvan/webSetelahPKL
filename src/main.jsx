import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginPage from "./components/pages/login.jsx";
import ErrorPage from "./components/pages/404.jsx";
import RegisterPage from "./components/pages/register.jsx";
import Product from "./components/pages/products.jsx";
import ProductUser from "./components/pages/productUser.jsx";
import AddProduct from "./components/pages/addProduct.jsx";
import TransactionHistory from "./components/pages/transaction.jsx";
import PaymentConfirmation from "./components/pages/paymentConfirm.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    // Path: /product
    path: "/product",
    element: <Product />,
  },
  {
    path:"/productUser",
    element: <ProductUser />,
  },
  {
    path: "/products/add",
    element: <AddProduct />,
  },
  {
    path: "/transactions",
    element: <TransactionHistory />,
  },
  // ==========================================================
  // ENDPOINT BARU UNTUK KONFIRMASI PEMBAYARAN
  // Menggunakan ':transactionId' agar bisa membaca ID dari URL
  // Contoh path: /payment/123
  {
    path: "/payment/:transactionId",
    element: <PaymentConfirmation />,
  },
  // ==========================================================
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
