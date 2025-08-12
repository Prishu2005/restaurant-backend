// models/order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  items: [
    {
      menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
      name: String, // store name to avoid extra lookup
      price: Number, // store price at time of order
      quantity: Number
    }
  ],
  customerName: String, // optional
  tableNumber: String, // optional for dine-in
  status: { type: String, default: "pending" }, // pending, preparing, served
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
