// src/middleware/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // Mengecek apakah email ada di localStorage
    const email = localStorage.getItem("email");
    const uid = localStorage.getItem("uid");

    // Jika tidak ada sesi (belum login), arahkan paksa ke halaman login
    if (!email || !uid) {
        return <Navigate to="/login" replace />;
    }

    // Jika sudah login, izinkan mengakses konten didalamnya
    return children;
};

export default ProtectedRoute;