import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
db.connect();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/signup", async (req, res) => {
  const { email, username, password } = req.body;
  try {
    const userexist = await db.query("SELECT * FROM users WHERE username=$1", [
      username,
    ]);
    if (userexist.rows.length > 0)
      return res.status(400).json({ message: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (email, username, password) VALUES ($1, $2, $3)",
      [email, username, hashedPassword]
    );

    res.status(200).json({ message: "Signup successful.", username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userResult = await db.query("SELECT * FROM users WHERE username=$1", [
      username,
    ]);
    if (userResult.rows.length === 0)
      return res.status(401).json({ message: "Invalid username" });

    const validPassword = await bcrypt.compare(
      password,
      userResult.rows[0].password
    );
    if (!validPassword)
      return res.status(401).json({ message: "Invalid password" });

    res.status(200).json({ message: "Login successful", username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during login" });
  }
});

app.post("/add-journal", async (req, res) => {
  const { username, title, content } = req.body;
  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE username=$1",
      [username]
    );
    if (userResult.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const userid = userResult.rows[0].id;
    await db.query(
      "INSERT INTO journals (user_id, title, content) VALUES ($1, $2, $3)",
      [userid, title, content]
    );
    res.status(200).json({ message: "Journal saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/journal/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE username=$1",
      [username]
    );
    if (userResult.rows.length === 0) return res.json([]);

    const userid = userResult.rows[0].id;
    const journals = await db.query(
      "SELECT title, content, created_at FROM journals WHERE user_id=$1 ORDER BY created_at DESC",
      [userid]
    );

    res.json(journals.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

const resetTokens = {};

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const userResult = await db.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (userResult.rows.length === 0)
      return res
        .status(404)
        .json({ message: "No account found with that email." });

    const token = Math.random().toString(36).substring(2, 15);
    resetTokens[token] = userResult.rows[0].username;

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset your Mini Journal password",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    });

    res.json({ message: "Reset link sent to your email!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error sending reset email" });
  }
});

app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  const username = resetTokens[token];
  if (!username)
    return res.status(400).json({ message: "Invalid or expired token." });

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password=$1 WHERE username=$2", [
      hashedPassword,
      username,
    ]);
    delete resetTokens[token];
    res.json({ message: "Password reset successful!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error resetting password" });
  }
});

app.get("/reset-password", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "reset-password.html"));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
