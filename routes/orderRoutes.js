// Filename: routes/orderRoutes.js

const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const mongoose = require("mongoose");

// --- THIS IS THE FIX ---
// Import 'startOfDay' from the correct library
const { startOfDay } = require('date-fns'); 
const { zonedTimeToUtc } = require('date-fns-tz');
// --- END OF FIX ---

// --- HELPER FUNCTION (Now with correct imports) ---
const getAndEmitStats = async (io, restaurantId) => {
  try {
    const timeZone = 'Asia/Kolkata';
    const nowInIndia = new Date(); 
    const startOfTodayInIndia = startOfDay(nowInIndia); // Corrected this line
    const today = zonedTimeToUtc(startOfTodayInIndia, timeZone);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await Order.aggregate([
      { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId), createdAt: { $gte: today, $lt: tomorrow } } },
      { $addFields: { orderTotal: { $sum: { $map: { input: "$items", as: "item", in: { $multiply: ["$$item.price", "$$item.quantity"] } } } } } },
      { $group: { _id: null, totalSales: { $sum: "$orderTotal" }, totalOrders: { $sum: 1 } } },
      { $project: { _id: 0, totalSales: 1, totalOrders: 1, averageOrderValue: { $cond: { if: { $gt: ["$totalOrders", 0] }, then: { $divide: ["$totalSales", "$totalOrders"] }, else: 0 } } } }
    ]);
    
    const result = stats[0] || { totalSales: 0, totalOrders: 0, averageOrderValue: 0 };
    io.emit('stats_updated', result);
  } catch (error) {
    console.error("Error calculating or emitting stats:", error);
  }
};


// --- API ROUTES ---

// Get sales statistics for today
router.get("/stats/:restaurantId", async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const timeZone = 'Asia/Kolkata';
        const nowInIndia = new Date();
        const startOfTodayInIndia = startOfDay(nowInIndia); // Corrected this line
        const today = zonedTimeToUtc(startOfTodayInIndia, timeZone);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const stats = await Order.aggregate([
            { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId), createdAt: { $gte: today, $lt: tomorrow } } },
            { $addFields: { orderTotal: { $sum: { $map: { input: "$items", as: "item", in: { $multiply: ["$$item.price", "$$item.quantity"] } } } } } },
            { $group: { _id: null, totalSales: { $sum: "$orderTotal" }, totalOrders: { $sum: 1 } } },
            { $project: { _id: 0, totalSales: 1, totalOrders: 1, averageOrderValue: { $cond: { if: { $gt: ["$totalOrders", 0] }, then: { $divide: ["$totalSales", "$totalOrders"] }, else: 0 } } } }
        ]);

        const result = stats[0] || { totalSales: 0, totalOrders: 0, averageOrderValue: 0 };
        res.json(result);

    } catch (error) {
        console.error("!!! CRASH in GET /stats/:restaurantId:", error);
        res.status(500).json({ message: "Error fetching stats", error });
    }
});


// ... (The rest of the file remains the same) ...
// Create a new order
router.post("/", async (req, res) => {
  try {
    const { restaurantId, items, customerName, tableNumber } = req.body;
    const newOrder = new Order({ restaurantId, items, customerName, tableNumber });
    await newOrder.save();
    req.io.emit('new_order', newOrder);
    getAndEmitStats(req.io, restaurantId);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error("!!! ERROR in order creation:", error);
    res.status(500).json({ message: "Error creating order", error });
  }
});

// Get all orders for a restaurant
router.get("/:restaurantId", async (req, res) => {
  try {
    let query = { restaurantId: req.params.restaurantId };
    if (req.query.view === 'active') {
      query.status = { $ne: 'served' };
    }
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
});

// Update order status
router.patch("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updatedOrder) return res.status(404).json({ message: "Order not found" });
    req.io.emit('order_status_updated', updatedOrder);
    if (updatedOrder.tableNumber) {
      req.io.to(`table_${updatedOrder.tableNumber}`).emit('order_status_updated', updatedOrder);
    }
    getAndEmitStats(req.io, updatedOrder.restaurantId);
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: "Error updating order", error });
  }
});

module.exports = router;