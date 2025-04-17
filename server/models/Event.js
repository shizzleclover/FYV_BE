const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new Schema({
  eventCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  hostName: {
    type: String,
    required: true,
    trim: true
  },
  questions: [{
    text: {
      type: String,
      required: true
    },
    options: [{
      type: String,
      required: true
    }]
  }],
  countdownDuration: {
    type: Number,
    required: true,
    default: 3600 // 1 hour in seconds
  },
  participants: [{
    type: String, // anonymousId references
    ref: 'Participant'
  }],
  startTime: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema);
