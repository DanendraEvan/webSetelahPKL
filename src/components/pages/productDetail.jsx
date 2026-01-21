import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../../firebase";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("email") || "Guest";

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loadingReview, setLoadingReview] = useState(false);

  // =============================
  // FETCH PRODUCT
  // =============================
  useEffect(() => {
    const fetchProduct = async () => {
      const ref = doc(db, "barang", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setProduct(snap.data());
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  // =============================
  // FETCH REVIEWS
  // =============================
  useEffect(() => {
    const fetchReviews = async () => {
      const q = query(
        collection(db, "barang", id, "reviews"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    fetchReviews();
  }, [id]);

  // =============================
  // SUBMIT REVIEW
  // =============================
  const handleSubmitReview = async () => {
    if (rating === 0 || comment.trim() === "") {
      alert("Rating dan komentar wajib diisi");
      return;
    }

    setLoadingReview(true);

    try {
      await addDoc(collection(db, "barang", id, "reviews"), {
        userEmail,
        rating,
        comment,
        createdAt: serverTimestamp()
      });

      setRating(0);
      setComment("");

      const snap = await getDocs(
        query(
          collection(db, "barang", id, "reviews"),
          orderBy("createdAt", "desc")
        )
      );
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      alert("Gagal mengirim review");
    } finally {
      setLoadingReview(false);
    }
  };

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return (
      reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    ).toFixed(1);
  }, [reviews]);

  if (loading) {
    return <div className="p-10 text-center">⏳ Memuat produk...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        className="mb-4 text-blue-600 hover:underline"
        onClick={() => navigate(-1)}
      >
        ← Kembali
      </button>

      {/* PRODUCT */}
      <div className="bg-white shadow-xl rounded-xl p-6 grid md:grid-cols-2 gap-6">
        <img
          src={product.image || "https://placehold.co/400"}
          alt={product.title}
          className="rounded-xl w-full object-cover"
        />

        <div>
          <h1 className="text-3xl font-bold mb-3">{product.title}</h1>
          <p className="text-gray-600 mb-4">
            {product.description || "Tidak ada deskripsi"}
          </p>

          <p className="text-2xl font-bold text-blue-600 mb-2">
            Rp {product.price?.toLocaleString("id-ID")}
          </p>

          <p className="text-yellow-500 font-semibold mb-4">
            ⭐ {averageRating} / 5 ({reviews.length} review)
          </p>
        </div>
      </div>

      {/* REVIEW FORM */}
      <div className="mt-8 bg-white shadow rounded-xl p-6">
        <h2 className="text-xl font-bold mb-3">📝 Beri Rating & Komentar</h2>

        <div className="flex gap-2 mb-3">
          {[1, 2, 3, 4, 5].map(num => (
            <button
              key={num}
              onClick={() => setRating(num)}
              className={`text-3xl ${
                num <= rating ? "text-yellow-400" : "text-gray-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          className="w-full border rounded-lg p-3 text-sm"
          rows="4"
          placeholder="Tulis komentar kamu..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button
          onClick={handleSubmitReview}
          disabled={loadingReview}
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
        >
          {loadingReview ? "Mengirim..." : "Kirim Review"}
        </button>
      </div>

      {/* REVIEW LIST */}
      <div className="mt-6 space-y-4">
        {reviews.length === 0 && (
          <p className="text-gray-400 text-sm">Belum ada review</p>
        )}

        {reviews.map(review => (
          <div key={review.id} className="bg-gray-50 p-4 rounded-lg shadow">
            <div className="flex justify-between">
              <span className="font-semibold">{review.userEmail}</span>
              <span className="text-yellow-400">
                {"★".repeat(review.rating)}
              </span>
            </div>
            <p className="text-gray-700 mt-2">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductDetail;