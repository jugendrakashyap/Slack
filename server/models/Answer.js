const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Answer content is required'],
    minlength: [10, 'Answer must be at least 10 characters long']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  votes: {
    upvotes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }],
    downvotes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
answerSchema.index({ author: 1 });
answerSchema.index({ question: 1 });
answerSchema.index({ createdAt: -1 });
answerSchema.index({ 'votes.upvotes.user': 1 });
answerSchema.index({ 'votes.downvotes.user': 1 });
answerSchema.index({ isAccepted: 1 });

// Virtual for vote score
answerSchema.virtual('voteScore').get(function() {
  return this.votes.upvotes.length - this.votes.downvotes.length;
});

// Ensure virtuals are included in JSON output
answerSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Answer', answerSchema);
