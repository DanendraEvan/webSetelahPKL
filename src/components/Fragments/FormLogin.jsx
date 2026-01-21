import { useState } from "react";
import Button from "../Elements/Button/button";
import InputForm from "../Elements/input";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase"; // sesuaikan path

const FormLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;
      localStorage.setItem("email", user.email);
      localStorage.setItem("uid", user.uid);

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
    <form onSubmit={handleSubmit}>
      <InputForm label="Email" name="email" type="email" placeholder="Masukkan Email" onChange={handleChange}/>
      <InputForm label="Password" name="password" type="password" placeholder="Masukkan Password" onChange={handleChange}/>
      
      <Button variant="bg-blue-600 w-full" type="submit">Login</Button>

      <Button 
        type="button"
        variant="bg-red-600 w-full mt-3"
        onClick={loginWithGoogle}
      >
        Login dengan Google
      </Button>
    </form>
  );
};

export default FormLogin;
