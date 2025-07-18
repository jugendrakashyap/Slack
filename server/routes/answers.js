const express = require('express');
const { body, validationResult } = require('express-validator');
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/answers
// @desc    Create a new answer
// @access  Private
router.post('/', [
  body('content')
    .isLength({ min: 10 })
    .withMessage('Answer must be at least 10 characters long'),
  body('questionId')
    .isMongoId()
    .withMessage('Valid question ID is required')
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { content, questionId } = req.body;

    // Check if question exists and is active
    const question = await Question.findById(questionId);
    if (!question || !question.isActive) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Create new answer
    const answer = new Answer({
      content,
      author: req.user._id,
      question: questionId
    });

    await answer.save();
    await answer.populate('author', 'username reputation avatar');

    // Add answer to question's answers array
    question.answers.push(answer._id);
    await question.save();

    // Create notification for question author (if not answering own question)
    if (question.author.toString() !== req.user._id.toString()) {
      const notification = new Notification({
        recipient: question.author,
        sender: req.user._id,
        type: 'answer',
        message: `${req.user.username} answered your question: ${question.title}`,
        relatedQuestion: questionId,
        relatedAnswer: answer._id
      });
      await notification.save();
    }

    res.status(201).json({
      message: 'Answer created successfully',
      answer
    });
  } catch (error) {
    console.error('Create answer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/answers/:id/vote
// @desc    Vote on an answer (upvote/downvote)
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
    const answer = await Answer.findById(req.params.id);

    if (!answer || !answer.isActive) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check if user is trying to vote on their own answer
    if (answer.author.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot vote on your own answer' });
    }

    const userId = req.user._id;
    const upvoteIndex = answer.votes.upvotes.findIndex(vote => vote.user.toString() === userId.toString());
    const downvoteIndex = answer.votes.downvotes.findIndex(vote => vote.user.toString() === userId.toString());

    // Remove existing votes
    if (upvoteIndex > -1) {
      answer.votes.upvotes.splice(upvoteIndex, 1);
    }
    if (downvoteIndex > -1) {
      answer.votes.downvotes.splice(downvoteIndex, 1);
    }

    // Add new vote if it's different from the removed one
    if (voteType === 'upvote' && upvoteIndex === -1) {
      answer.votes.upvotes.push({ user: userId });
    } else if (voteType === 'downvote' && downvoteIndex === -1) {
      answer.votes.downvotes.push({ user: userId });
    }

    await answer.save();

    res.json({
      message: 'Vote recorded successfully',
      voteScore: answer.voteScore,
      upvotes: answer.votes.upvotes.length,
      downvotes: answer.votes.downvotes.length
    });
  } catch (error) {
    console.error('Vote answer error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Answer not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/answers/:id/accept
// @desc    Accept an answer (only question author can do this)
// @access  Private
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id).populate('question');

    if (!answer || !answer.isActive) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const question = answer.question;

    // Check if user is the question author
    if (question.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the question author can accept answers' });
    }

    // Check if question is closed
    if (question.isClosed) {
      return res.status(400).json({ message: 'Cannot accept answers on a closed question' });
    }

    // Unaccept previous answer if exists
    if (question.acceptedAnswer) {
      const previousAnswer = await Answer.findById(question.acceptedAnswer);
      if (previousAnswer) {
        previousAnswer.isAccepted = false;
        previousAnswer.acceptedAt = null;
        await previousAnswer.save();
      }
    }

    // Accept the new answer
    answer.isAccepted = true;
    answer.acceptedAt = new Date();
    await answer.save();

    // Update question
    question.acceptedAnswer = answer._id;
    await question.save();

    // Create notification for answer author (if not accepting own answer)
    if (answer.author.toString() !== req.user._id.toString()) {
      const notification = new Notification({
        recipient: answer.author,
        sender: req.user._id,
        type: 'accepted_answer',
        message: `Your answer was accepted for: ${question.title}`,
        relatedQuestion: question._id,
        relatedAnswer: answer._id
      });
      await notification.save();
    }

    res.json({
      message: 'Answer accepted successfully',
      answer: {
        id: answer._id,
        isAccepted: answer.isAccepted,
        acceptedAt: answer.acceptedAt
      }
    });
  } catch (error) {
    console.error('Accept answer error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Answer not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/answers/:id
// @desc    Delete an answer (soft delete)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check if user is the answer author or admin
    if (answer.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this answer' });
    }

    // Soft delete
    answer.isActive = false;
    await answer.save();

    // Remove from question's answers array
    await Question.findByIdAndUpdate(answer.question, {
      $pull: { answers: answer._id }
    });

    res.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    console.error('Delete answer error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Answer not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
