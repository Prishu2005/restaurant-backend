const express = require("express");
const router = express.Router();
const MenuItem = require("../models/MenuItem");

// --- THIS IS THE UPGRADE ---
// This route now handles requests from BOTH customers and admins.
router.get("/", async (req, res) => {
  const { restaurantId, showAll } = req.query;
  if (!restaurantId) {
    return res.status(400).json({ error: "restaurantId is required" });
  }

  try {
    let query = { restaurantId };

    // If the request is NOT from an admin, only show available items.
    // The admin will send `showAll=true`.
    if (showAll !== 'true') {
      query.isAvailable = true;
    }

    const menuItems = await MenuItem.find(query);
    res.json(menuItems);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
});


// Add menu item
router.post("/", async (req, res) => {
  const { name, description, price, restaurantId } = req.body;
  let { category } = req.body;
  if (!restaurantId) {
    return res.status(400).json({ error: "restaurantId is required" });
  }
  if (category && typeof category === 'string' && category.trim() !== '') {
    category = category.trim().toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  } else {
    category = 'Uncategorized';
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

// Toggle item availability
router.patch("/:id/availability", async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { isAvailable },
      { new: true }
    );
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to update item availability" });
  }
});

module.exports = router;