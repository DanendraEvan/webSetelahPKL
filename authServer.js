import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pkg from "pg";

const { Pool } = pkg;
const app = express();
const port = 5000;

// koneksi postgres
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "tokoku",
  password: "1234", // ganti dengan password postgresmu
  port: 5432,
});

app.use(cors());
app.use(express.json());

// 🔹 REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // cek email sudah ada
    const checkUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // simpan ke database
    const result = await pool.query(
      "INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3) RETURNING id, full_name, email",
      [fullName, email, hashedPassword]
    );

    res.json({ message: "Register berhasil", user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // cek user ada atau tidak
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "User tidak ditemukan" });
    }

    const user = result.rows[0];

    // cek password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Password salah" });
    }

    // generate token
    const token = jwt.sign({ id: user.id, email: user.email }, "SECRET_KEY", { expiresIn: "1h" });

    res.json({ message: "Login berhasil", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Auth server running on http://localhost:${port}`);
});
