const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Notification = require('../models/Notification');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/questions
// @desc    Get all questions with pagination and filtering
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('sort').optional().isIn(['newest', 'oldest', 'votes', 'views']).withMessage('Invalid sort option'),
  query('tags').optional().isString().withMessage('Tags must be a string'),
  query('search').optional().isString().withMessage('Search must be a string')
], optionalAuth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || 'newest';
    const tags = req.query.tags ? req.query.tags.split(',').map(tag => tag.trim()) : [];
    const search = req.query.search;

    // Build query
    let query = { isActive: true };

    // Add tag filter
    if (tags.length > 0) {
      query.tags = { $in: tags };
    }

    // Add search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'votes':
        sortObj = { 'votes.upvotes': -1, 'votes.downvotes': 1 };
        break;
      case 'views':
        sortObj = { views: -1 };
        break;
      default: // newest
        sortObj = { createdAt: -1 };
    }

    const questions = await Question.find(query)
      .populate('author', 'username reputation avatar')
      .populate('acceptedAnswer', 'author content createdAt')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Question.countDocuments(query);

    res.json({
      questions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/questions/:id
// @desc    Get a single question by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('author', 'username reputation avatar joinedAt')
      .populate({
        path: 'answers',
        populate: {
          path: 'author',
          select: 'username reputation avatar'
        }
      })
      .populate('acceptedAnswer', 'author content createdAt');

    if (!question || !question.isActive) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Increment view count (only if not the author)
    if (!req.user || req.user._id.toString() !== question.author._id.toString()) {
      question.views += 1;
      await question.save();
    }

    res.json(question);
  } catch (error) {
    console.error('Get question error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/questions
// @desc    Create a new question
// @access  Private
router.post('/', [
  body('title')
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters')
    .trim(),
  body('description')
    .isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters long'),
  body('tags')
    .isArray({ min: 1, max: 5 })
    .withMessage('Must provide 1-5 tags')
    .custom((tags) => {
      for (let tag of tags) {
        if (typeof tag !== 'string' || tag.length > 30) {
          throw new Error('Each tag must be a string with max 30 characters');
        }
      }
      return true;
    })
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, tags } = req.body;

    const question = new Question({
      title,
      description,
      author: req.user._id,
      tags: tags.map(tag => tag.toLowerCase().trim())
    });

    await question.save();
    await question.populate('author', 'username reputation avatar');

    res.status(201).json({
      message: 'Question created successfully',
      question
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/questions/:id/vote
// @desc    Vote on a question (upvote/downvote)
// @access  Private
router.post('/:id/vote', [
  body('voteType')
    .isIn(['upvote', 'downvote'])
    .withMessage('Vote type must be either upvote or downvote')
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { voteType } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question || !question.isActive) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user is trying to vote on their own question
    if (question.author.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot vote on your own question' });
    }

    const userId = req.user._id;
    const upvoteIndex = question.votes.upvotes.findIndex(vote => vote.user.toString() === userId.toString());
    const downvoteIndex = question.votes.downvotes.findIndex(vote => vote.user.toString() === userId.toString());

    // Remove existing votes
    if (upvoteIndex > -1) {
      question.votes.upvotes.splice(upvoteIndex, 1);
    }
    if (downvoteIndex > -1) {
      question.votes.downvotes.splice(downvoteIndex, 1);
    }

    // Add new vote if it's different from the removed one
    if (voteType === 'upvote' && upvoteIndex === -1) {
      question.votes.upvotes.push({ user: userId });
    } else if (voteType === 'downvote' && downvoteIndex === -1) {
      question.votes.downvotes.push({ user: userId });
    }

    await question.save();

    res.json({
      message: 'Vote recorded successfully',
      voteScore: question.voteScore,
      upvotes: question.votes.upvotes.length,
      downvotes: question.votes.downvotes.length
    });
  } catch (error) {
    console.error('Vote question error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
