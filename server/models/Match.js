const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MatchSchema = new Schema({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  participant1Id: {
    type: String, // anonymousId reference
    required: true
  },
  participant2Id: {
    type: String, // anonymousId reference, null for unmatched
    default: null
  },
  compatibilityScore: {
    type: Number,
    default: 0
  },
  isWildCard: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Match', MatchSchema);
