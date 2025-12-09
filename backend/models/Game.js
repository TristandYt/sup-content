const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  rawgId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String },
  released: { type: Date },
  background_image: { type: String },
  rating: { type: Number },
  ratings_count: { type: Number },
  metacritic: { type: Number },
  platforms: [{ type: String }],
  genres: [{ type: String }],
  developers: [{ type: String }],
  publishers: [{ type: String }],
  description: { type: String },
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Game', gameSchema);
