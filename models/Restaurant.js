//Restaurant.js
const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: String,
});

module.exports = mongoose.model("Restaurant", restaurantSchema);
