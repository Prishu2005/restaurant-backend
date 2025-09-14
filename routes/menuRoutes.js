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
  const { name, description, price, restaurantId } = req.body;
  let { category } = req.body; // Use 'let' to allow modification

  if (!restaurantId) {
    return res.status(400).json({ error: "restaurantId is required" });
  }

  // --- UPGRADE: Standardize the category name ---
  // If a category is provided, format it to "Title Case".
  if (category && typeof category === 'string' && category.trim() !== '') {
    category = category
      .trim() // Remove leading/trailing spaces
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } else {
    // If no category is given, assign a default.
    category = 'Uncategorized';
  }
  // --- END OF UPGRADE ---

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