import { useState } from "react";
import InputForm from "../Elements/input";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";

const FormLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Login khusus admin (tanpa Firebase)
    if (formData.email === "admin@gmail.com" && formData.password === "admin123") {
      localStorage.setItem("email", "admin@gmail.com");
      localStorage.setItem("role", "admin");
      alert("Login Admin berhasil!");
      window.location.href = "/product"; // halaman admin
      return;
    }
  
    // Login normal via Firebase
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
  
      const user = userCredential.user;
      localStorage.setItem("email", user.email);
      localStorage.setItem("uid", user.uid);
      localStorage.setItem("role", "user");
  
      alert("Login berhasil!");
      window.location.href = "/productUser";
    } catch (error) {
      alert("Login gagal: " + error.message);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      localStorage.setItem("email", user.email);
      localStorage.setItem("uid", user.uid);

      alert("Login Google berhasil!");
      window.location.href = "/productUser";
    } catch (error) {
      alert("Login Google gagal: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          name="email"
          type="email"
          placeholder="Masukkan email Anda"
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-700"
          required
        />
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <a href="#" className="text-xs text-blue-600 hover:text-blue-800">Lupa password?</a>
        </div>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-700 pr-16"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      
      <div className="flex items-center">
        <input
          id="remember-me"
          name="remember-me"
          type="checkbox"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
          Ingat saya
        </label>
      </div>
      
      <div className="space-y-4 pt-2">
        <button 
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium transition duration-200 shadow-md"
        >
          Masuk
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">atau</span>
          </div>
        </div>

        <button 
          type="button"
          onClick={loginWithGoogle}
          className="w-full bg-white text-gray-700 py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition duration-200 flex items-center justify-center space-x-2"
        >
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google" 
            className="w-5 h-5"
          />
          <span>Masuk dengan Google</span>
        </button>
      </div>
    </form>
  );
};

export default FormLogin;
