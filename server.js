const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const http = require('http');
const { Server } = require("socket.io");

// Import all your routes
const restaurantRoutes = require("./routes/restaurantRoutes");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// --- Socket.IO Integration ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://restaurantqrcode.netlify.app", // Your Netlify frontend URL
    methods: ["GET", "POST"]
  }
});

// Middleware to attach `io` to every request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- Database Connection ---
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- API Routes ---
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

// --- Main Socket.IO Connection Handler ---
io.on('connection', (socket) => {
  console.log('✅ A user connected via Socket.IO:', socket.id);

  // NEW: Listen for a customer joining a table-specific room
  socket.on('join_table_room', (tableNumber) => {
    if (tableNumber) {
      const roomName = `table_${tableNumber}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room ${roomName}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// --- Server Startup ---
const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);