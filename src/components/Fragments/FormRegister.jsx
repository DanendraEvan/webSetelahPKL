import { useState } from "react";
import Button from "../Elements/Button/button";
import InputForm from "../Elements/input";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../firebase"; // sesuaikan path

const FormRegister = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const { fullName, email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      alert("Password dan konfirmasi password tidak cocok!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Simpan nama ke profile Firebase
      await updateProfile(userCredential.user, {
        displayName: fullName
      });

      alert("Registrasi berhasil!");
      window.location.href = "/login";
    } catch (error) {
      alert("Registrasi gagal: " + error.message);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <InputForm label="Full Name" name="fullName" type="text" placeholder="Masukkan Nama Anda" onChange={handleChange}/>
      <InputForm label="Email" name="email" type="email" placeholder="Masukkan Email Anda" onChange={handleChange}/>
      <InputForm label="Password" name="password" type="password" placeholder="Masukkan Password Anda" onChange={handleChange}/>
      <InputForm label="Confirm Password" name="confirmPassword" type="password" placeholder="Konfirmasi Password Anda" onChange={handleChange}/>
      <Button variant="bg-blue-600 w-full" type="submit">Register</Button>
    </form>
  );
};

export default FormRegister;
