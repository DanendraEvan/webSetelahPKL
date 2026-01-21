import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase"; 
import { collection, query, where, getDocs, limit, setDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function AccountPage() {
  const [userEmail, setUserEmail] = useState(localStorage.getItem("email") || "Guest");
  const [uid, setUid] = useState(null);
  const [personalInfo, setPersonalInfo] = useState({
    alamat: "",
    no_telp: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const personalInfoRef = collection(db, "personal_info");
          const q = query(personalInfoRef, where("user_uid", "==", user.uid), limit(1));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            setPersonalInfo({
              alamat: data.alamat || "",
              no_telp: data.no_telp || "",
            });
          }
        } catch (err) {
          console.error("Gagal mengambil data:", err);
        }
      } else {
        navigate("/login");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!uid) return;

    setIsSaving(true);
    try {
      // Kita gunakan doc ID yang sama dengan UID agar konsisten dan mudah dikelola
      await setDoc(doc(db, "personal_info", uid), {
        user_uid: uid,
        alamat: personalInfo.alamat,
        no_telp: personalInfo.no_telp,
        last_updated: new Date()
      }, { merge: true }); // Merge true agar tidak menimpa field lain jika ada

      alert("Data berhasil diperbarui, Sir!");
    } catch (err) {
      console.error("Gagal menyimpan data:", err);
      alert("Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-solid"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-indigo-700 to-blue-800 p-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md border border-white/30 shadow-inner">
            <span className="text-3xl">📝</span>
          </div>
          <h2 className="text-white text-xl font-bold tracking-tight">Edit Profil</h2>
          <p className="text-blue-100 text-xs opacity-80 mt-1">Kelola informasi pengiriman Anda</p>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          {/* Email - Read Only */}
          <div className="animate-slideIn">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2">
              Email Terdaftar (Permanen)
            </label>
            <input 
              type="text" 
              value={userEmail} 
              disabled 
              className="w-full p-4 bg-gray-100 rounded-xl border border-gray-200 font-semibold text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* No Telp - Input */}
          <div className="animate-slideIn" style={{ animationDelay: '0.1s' }}>
            <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-[2px] mb-2">
              Nomor Telepon
            </label>
            <input 
              type="text" 
              placeholder="Contoh: 08123456789"
              value={personalInfo.no_telp}
              onChange={(e) => setPersonalInfo({...personalInfo, no_telp: e.target.value})}
              className="w-full p-4 bg-white rounded-xl border border-gray-200 text-gray-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          {/* Alamat - Textarea */}
          <div className="animate-slideIn" style={{ animationDelay: '0.2s' }}>
            <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-[2px] mb-2">
              Alamat Lengkap
            </label>
            <textarea 
              rows="3"
              placeholder="Masukkan alamat pengiriman..."
              value={personalInfo.alamat}
              onChange={(e) => setPersonalInfo({...personalInfo, alamat: e.target.value})}
              className="w-full p-4 bg-white rounded-xl border border-gray-200 text-gray-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
              required
            ></textarea>
          </div>

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={isSaving}
              className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 ${isSaving ? 'opacity-70' : ''}`}
            >
              {isSaving ? "Menyimpan..." : "💾 Simpan Perubahan"}
            </button>
            
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl transition-all border border-gray-200"
            >
              Batal
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideIn {
          animation: slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}