const express = require('express');
const router = express.Router();
const Vote = require('../models/Vote');
const Event = require('../models/Event');
const Participant = require('../models/Participant');

/**
 * @route   POST /api/events/:eventCode/vote
 * @desc    Submit a vote for an outfit
 * @access  Public
 */
router.post('/:eventCode/vote', async (req, res) => {
  try {
    const { eventCode } = req.params;
    const { voterId, outfitOwnerId, score } = req.body;

    // Validate required fields
    if (!voterId || !outfitOwnerId || !score) {
      return res.status(400).json({ message: 'Voter ID, outfit owner ID, and score are required' });
    }

    // Validate score (1-5)
    if (score < 1 || score > 5 || !Number.isInteger(score)) {
      return res.status(400).json({ message: 'Score must be an integer between 1 and 5' });
    }

    // Find event by code
    const event = await Event.findOne({ eventCode });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Verify both participants exist
    const voter = await Participant.findOne({ anonymousId: voterId, eventId: event._id });
    const outfitOwner = await Participant.findOne({ anonymousId: outfitOwnerId, eventId: event._id });

    if (!voter || !outfitOwner) {
      return res.status(404).json({ message: 'One or both participants not found' });
    }

    // Prevent voting for own outfit
    if (voterId === outfitOwnerId) {
      return res.status(400).json({ message: 'Cannot vote for your own outfit' });
    }

    // Check if outfit exists
    if (!outfitOwner.outfit) {
      return res.status(400).json({ message: 'Target participant has not submitted an outfit' });
    }

    // Create or update vote
    const existingVote = await Vote.findOne({
      eventId: event._id,
      voterId,
      outfitOwnerId
    });

    if (existingVote) {
      // Update existing vote
      existingVote.score = score;
      await existingVote.save();
      res.json({ message: 'Vote updated successfully' });
    } else {
      // Create new vote
      const newVote = new Vote({
        eventId: event._id,
        voterId,
        outfitOwnerId,
        score
      });
      await newVote.save();
      res.status(201).json({ message: 'Vote submitted successfully' });
    }
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/events/:eventCode/leaderboard
 * @desc    Get outfit voting leaderboard
 * @access  Public
 */
router.get('/:eventCode/leaderboard', async (req, res) => {
  try {
    const { eventCode } = req.params;

    // Find event by code
    const event = await Event.findOne({ eventCode });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get all participants with outfits
    const participants = await Participant.find({
      eventId: event._id,
      outfit: { $exists: true, $ne: '' }
    });

    // Get all votes for this event
    const votes = await Vote.find({ eventId: event._id });

    // Calculate average scores
    const leaderboard = [];
    for (const participant of participants) {
      const participantVotes = votes.filter(vote => vote.outfitOwnerId === participant.anonymousId);
      
      if (participantVotes.length > 0) {
        const totalScore = participantVotes.reduce((sum, vote) => sum + vote.score, 0);
        const averageScore = totalScore / participantVotes.length;
        
        leaderboard.push({
          anonymousId: participant.anonymousId,
          outfit: participant.outfit,
          outfitImageUrl: participant.outfitImageUrl || null,
          averageScore,
          voteCount: participantVotes.length
        });
      } else {
        leaderboard.push({
          anonymousId: participant.anonymousId,
          outfit: participant.outfit,
          outfitImageUrl: participant.outfitImageUrl || null,
          averageScore: 0,
          voteCount: 0
        });
      }
    }

    // Sort by average score (highest first)
    leaderboard.sort((a, b) => b.averageScore - a.averageScore);

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
