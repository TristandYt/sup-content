const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  isPublic: { type: Boolean, default: true },
  games: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('List', listSchema);
