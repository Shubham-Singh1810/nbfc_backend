require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./src/route");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const startCronScheduler = require("./src/corn/notifyCorn"); // Cron import 👈

const app = express();
const server = createServer(app);

// ========================
// 🛡 Middleware & CORS
// ========================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// ========================
// 🔌 Socket.IO Setup
// ========================
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
  transports: ["websocket"],
});

io.on("connection", (socket) => {
  console.log("User connected =>", socket.id);

  socket.on("sendMessage", (data) => {
    io.emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected =>", socket.id);
  });
});

// Attach io to every API request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ========================
// 📡 Routes Setup
// ========================
app.get("/", (req, res) =>
  res.send(`Server running on port ${process.env.PORT}`)
);
app.use("/api", routes);

app.all("*", (req, res) => {
  res.status(404).json({ error: "404 Route Not Found" });
});

// ========================
// 🛢 Database + Server Start
// ========================
const PORT = process.env.PORT || 8000;

mongoose
  .connect(process.env.DB_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✔ MongoDB Connected!");

    // ⏱ Start Cron after DB connection only
    startCronScheduler();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("❌ DB Connection Error: ", err.message));
