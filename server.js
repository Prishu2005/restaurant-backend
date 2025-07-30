const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); 

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ Connected to MongoDB");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});

const MenuItem = mongoose.model("MenuItem", {
  name: String,
  description: String,
  price: Number,
  category: String,
});

app.get("/menu", async (req, res) => {
  const items = await MenuItem.find();
  res.json(items);
});

app.post("/menu", async (req, res) => {
  const newItem = new MenuItem(req.body);
  await newItem.save();
  res.json(newItem);
});

app.put("/menu/:id", async (req, res) => {
  const updated = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.delete("/menu/:id", async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
