//orederRoutes.js
const express = require("express");
const router = express.Router();
const Order = require("../models/order");

// Create a new order
router.post("/", async (req, res) => {
  try {
    const { restaurantId, items, customerName, tableNumber } = req.body;
    const newOrder = new Order({
      restaurantId,
      items,
      customerName,
      tableNumber,
    });
    await newOrder.save();

    req.io.emit('new_order', newOrder);

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("!!! ERROR in order creation or socket emit:", error);
    res.status(500).json({ message: "Error creating order", error });
  }
});

// Get all orders for a restaurant (with filtering for active orders)
router.get("/:restaurantId", async (req, res) => {
  try {
    let query = { restaurantId: req.params.restaurantId };

    // This allows the frontend to ask for only active orders
    // by using the URL: /api/orders/someId?view=active
    if (req.query.view === 'active') {
      query.status = { $ne: 'served' }; // $ne means "not equal to"
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
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    // After updating, emit an 'order_status_updated' event to all clients.
    // This tells the reception dashboard to update the order's status or remove it.
    req.io.emit('order_status_updated', updatedOrder);

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: "Error updating order", error });
  }
});

module.exports = router;
