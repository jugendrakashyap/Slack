const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['answer', 'comment', 'mention', 'vote', 'accepted_answer'],
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: [200, 'Notification message cannot exceed 200 characters']
  },
  relatedQuestion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    default: null
  },
  relatedAnswer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer',
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });

// Method to mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
