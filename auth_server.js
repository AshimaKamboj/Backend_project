const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const port = 3500;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DATA_FOLDER = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_FOLDER, "users.json");
const PACKAGE_FILE = path.join(DATA_FOLDER, "package.json");
const BLOG_FILE = path.join(DATA_FOLDER, "blogs.json");

if (!fs.existsSync(DATA_FOLDER)) fs.mkdirSync(DATA_FOLDER);
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
if (!fs.existsSync(PACKAGE_FILE)) fs.writeFileSync(PACKAGE_FILE, JSON.stringify([]));
if (!fs.existsSync(BLOG_FILE)) fs.writeFileSync(BLOG_FILE, JSON.stringify([]));

const SECRET_KEY = "abcd";

app.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const users = JSON.parse(await fs.promises.readFile(USERS_FILE));
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: "User already exists. Please log in." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { name, email, password: hashedPassword, role: role || "user" };

    users.push(newUser);
    await fs.promises.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    res.status(201).json({ message: "Sign-up successful!" });
  } catch (err) {
    res.status(500).json({ message: "Error signing up user" });
  }
});


app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const users = JSON.parse(await fs.promises.readFile(USERS_FILE));
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Incorrect password" });

    const token = jwt.sign({ email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: "2h" });
    res.status(200).json({ message: "Login successful", token, name: user.name, role: user.role });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

function authenticateBookingUser(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Authorization token missing" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== "user" && decoded.role !== "admin") {
      return res.status(403).json({ message: "Only Admins or Users can book packages." });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}


app.post("/bookings", authenticateBookingUser, async (req, res) => {
  const { name, email, contact, people, destination } = req.body;

  if (!name || !email || !contact || !people || !destination) {
    return res.status(400).json({ message: "All booking fields are required." });
  }

  const newBooking = {
    name,
    email,
    contact,
    people,
    destination,
    date: new Date().toISOString(),
  };

  try {
    const bookings = JSON.parse(await fs.promises.readFile(PACKAGE_FILE));
    bookings.push(newBooking);
    await fs.promises.writeFile(PACKAGE_FILE, JSON.stringify(bookings, null, 2));
    res.status(201).json({ message: "Package booked successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error saving booking", error: err.message });
  }
});

app.post("/save_blog", async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required." });
  }

  try {
    let blogs = [];
    if (fs.existsSync(BLOG_FILE)) {
      blogs = JSON.parse(await fs.promises.readFile(BLOG_FILE));
    }

    const newBlog = { title, content, date: new Date() };
    blogs.push(newBlog);

    await fs.promises.writeFile(BLOG_FILE, JSON.stringify(blogs, null, 2));
    res.status(200).json({ success: true, message: "Blog post saved!" });
  } catch (error) {
    res.status(500).json({ message: "Error saving blog post", error: error.message });
  }
});

app.get("/get_blogs", async (req, res) => {
  try {
    const blogs = JSON.parse(await fs.promises.readFile(BLOG_FILE));
    res.status(200).json(blogs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching blog entries" });
  }
});

app.delete("/delete_blog/:index", async (req, res) => {
  const { index } = req.params;
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const blogs = JSON.parse(await fs.promises.readFile(BLOG_FILE));

    if (index < 0 || index >= blogs.length) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    blogs.splice(index, 1);
    await fs.promises.writeFile(BLOG_FILE, JSON.stringify(blogs, null, 2));
    res.status(200).json({ success: true, message: "Blog post deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting blog post" });
  }
});

// ✅ Start Server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
