const express = require('express');
const User = require('../models/User');
const List = require('../models/List');
const Review = require('../models/Review');
const auth = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get user's lists
router.get('/lists', auth, async (req, res) => {
  try {
    const lists = await List.find({ user: req.user.id });
    res.json(lists);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create a new list
router.post('/lists', auth, async (req, res) => {
  const { name, description, isPublic } = req.body;
  try {
    const list = new List({
      user: req.user.id,
      name,
      description,
      isPublic,
    });
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get user's reviews
router.get('/reviews', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id }).populate('game');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
