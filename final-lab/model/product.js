// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  picture: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
  wishlists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wishlist'
  }]
});

module.exports = mongoose.model('Product', productSchema);
