const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FollowUpSchema = new Schema({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  participantId: {
    type: String, // anonymousId reference
    required: true
  },
  reconnect: {
    type: Boolean,
    required: true
  },
  contactInfo: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a participant can only submit one follow-up per event
FollowUpSchema.index({ eventId: 1, participantId: 1 }, { unique: true });

module.exports = mongoose.model('FollowUp', FollowUpSchema);
