const express = require("express");
const router = express.Router();
const MenuItem = require("../models/MenuItem");

// Get menu items by restaurant ID
router.get("/", async (req, res) => {
  const { restaurantId } = req.query;
  if (!restaurantId) {
    return res.status(400).json({ error: "restaurantId is required" });
  }

  try {
    const menuItems = await MenuItem.find({ restaurantId });
    res.json(menuItems);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
});

// Add menu item
router.post("/", async (req, res) => {
  const { name, description, price, category, restaurantId } = req.body;

  if (!restaurantId) {
    return res.status(400).json({ error: "restaurantId is required" });
  }

  try {
    const newItem = new MenuItem({ name, description, price, category, restaurantId });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to add menu item" });
  }
});

// Delete menu item
router.delete("/:id", async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: "Menu item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete menu item" });
  }
});

module.exports = router;

