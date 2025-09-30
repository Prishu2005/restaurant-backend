const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  items: [
    {
      menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
      name: String,
      price: Number,
      quantity: Number,
      // --- NEW FEATURE ---
      // Add an optional field to store customer notes for an item.
      notes: { type: String, default: "" },
    }
  ],
  customerName: String,
  tableNumber: String,
  status: { type: String, default: "pending" },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 2592000 // Auto-delete after 30 days
  }
});

module.exports = mongoose.model("Order", orderSchema);