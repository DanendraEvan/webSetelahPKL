import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputForm from "../Elements/input";// pastikan path sesuai
import Button from "../Elements/Button/button";

const AddProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    image: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        alert("Produk berhasil ditambahkan!");
        navigate("/product");
      } else {
        alert(data.error || "Gagal menambahkan produk");
      }
    } catch (err) {
      console.error("Error submit:", err);
      alert("Terjadi kesalahan server");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-6">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-blue-600">Tambah Produk</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputForm
            label="Nama Produk"
            type="text"
            name="title"
            placeholder="Masukkan nama produk"
            onChange={handleChange}
          />
          <InputForm
            label="Deskripsi Produk"
            type="text"
            name="description"
            placeholder="Masukkan deskripsi"
            onChange={handleChange}
          />
          <InputForm
            label="Harga Produk"
            type="number"
            name="price"
            placeholder="Masukkan harga"
            onChange={handleChange}
          />
          <InputForm
            label="URL Gambar"
            type="text"
            name="image"
            placeholder="https://..."
            onChange={handleChange}
          />

          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full">
            Simpan Produk
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
