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

// --- Socket.IO Integration (Moved Higher) ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://restaurantqrcode.netlify.app", // Your Netlify frontend URL
    methods: ["GET", "POST"]
  }
});

// --- THIS IS THE FIX ---
// The middleware to attach `io` MUST be defined BEFORE the API routes that use it.
app.use((req, res, next) => {
  req.io = io;
  next();
});
// --- END OF FIX ---

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


io.on('connection', (socket) => {
  console.log('✅ A user connected via Socket.IO:', socket.id);
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// --- Server Startup ---
const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);