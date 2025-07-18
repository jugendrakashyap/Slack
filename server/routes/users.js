const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users with pagination (admin only)
// @access  Private (Admin)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('search').optional().isString().withMessage('Search must be a string')
], auth, adminAuth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search;

    // Build query
    let query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's question and answer counts
    const questionCount = await Question.countDocuments({ 
      author: user._id, 
      isActive: true 
    });
    
    const answerCount = await Answer.countDocuments({ 
      author: user._id, 
      isActive: true 
    });

    // Get recent questions and answers
    const recentQuestions = await Question.find({ 
      author: user._id, 
      isActive: true 
    })
      .select('title createdAt views')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentAnswers = await Answer.find({ 
      author: user._id, 
      isActive: true 
    })
      .populate('question', 'title')
      .select('content createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      user: {
        ...user,
        questionCount,
        answerCount,
        recentQuestions,
        recentAnswers
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { username, bio } = req.body;
    const updateFields = {};

    if (username && username !== req.user.username) {
      // Check if username is already taken
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      updateFields.username = username;
    }

    if (bio !== undefined) {
      updateFields.bio = bio;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
