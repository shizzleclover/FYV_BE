const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VoteSchema = new Schema({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  voterId: {
    type: String, // anonymousId of voter
    required: true
  },
  outfitOwnerId: {
    type: String, // anonymousId of outfit owner
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a participant can only vote once for each outfit
VoteSchema.index({ eventId: 1, voterId: 1, outfitOwnerId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', VoteSchema);
