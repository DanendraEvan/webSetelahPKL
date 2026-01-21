import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import pkg from "pg";
import bcrypt from "bcrypt";

const { Pool } = pkg;
const app = express();
const port = 5000;

// middleware
app.use(cors());
app.use(bodyParser.json());

// koneksi database
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "tokoku", // ganti sesuai database kamu
  password: "1234", 		// ganti sesuai password postgres kamu
  port: 5432,
});

// API Register
app.post("/api/register", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (fullname, email, password) VALUES ($1, $2, $3)",
      [fullname, email, hashedPassword]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// API Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: "Invalid password" });
    }

    res.json({ message: "Login success", user: {
        id: user.id, // ID pengguna
        fullname: user.fullname,
        email: user.email
    } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// API Products
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API CHECKOUT (Simpan Transaksi)
app.post("/api/checkout", async (req, res) => {
  try {
    const { userId, itemsSnapshot, total } = req.body;
    
    if (!userId || itemsSnapshot.length === 0 || total === undefined) {
        return res.status(400).json({ error: "Data pesanan tidak valid." });
    }

    const transactionResult = await pool.query(
      "INSERT INTO transactions (user_id, items_snapshot, total_price, status) VALUES ($1, $2, $3, 'Sedang diproses') RETURNING id",
      [userId, JSON.stringify(itemsSnapshot), total]
    );
    
    const transactionId = transactionResult.rows[0].id;

    res.status(201).json({ message: "Pesanan berhasil disimpan dan sedang diproses.", transactionId });

  } catch (err) {
    console.error("Checkout error:", err.message);
    res.status(500).json({ error: "Checkout gagal: " + err.message });
  }
});

// API FETCH TRANSAKSI BERDASARKAN ID
app.get("/api/transactions/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const result = await pool.query(
      "SELECT id, user_id, transaction_date, items_snapshot, total_price, status FROM transactions WHERE id = $1",
      [transactionId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Transaksi tidak ditemukan." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching single transaction:", err.message);
    res.status(500).json({ error: "Gagal memuat transaksi: " + err.message });
  }
});


// API UPDATE STATUS TRANSAKSI (BARU)
app.put("/api/transactions/:transactionId/status", async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { newStatus } = req.body;
    
    if (!newStatus) {
        return res.status(400).json({ error: "Status baru wajib diisi." });
    }

    const validStatuses = ['Sedang diproses', 'Berhasil', 'Dibatalkan'];
    if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({ error: "Status tidak valid." });
    }

    const result = await pool.query(
      "UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *",
      [newStatus, transactionId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Transaksi tidak ditemukan." });
    }

    res.json({ message: "Status transaksi berhasil diperbarui.", transaction: result.rows[0] });
  } catch (err) {
    console.error("Error updating transaction status:", err.message);
    res.status(500).json({ error: "Gagal memperbarui status: " + err.message });
  }
});

// API FETCH TRANSACTIONS BY USER ID
app.get("/api/transactions/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (isNaN(parseInt(userId))) {
        return res.status(400).json({ error: "ID pengguna tidak valid." });
    }

    const result = await pool.query(
      "SELECT id, user_id, transaction_date, items_snapshot, total_price, status FROM transactions WHERE user_id = $1 ORDER BY transaction_date DESC",
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching transactions:", err.message);
    res.status(500).json({ error: "Gagal memuat riwayat transaksi: " + err.message });
  }
});


// jalankan server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
