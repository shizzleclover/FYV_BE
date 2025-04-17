const express = require('express');
const router = express.Router();
const FollowUp = require('../models/FollowUp');
const Event = require('../models/Event');
const Participant = require('../models/Participant');
const Match = require('../models/Match');

/**
 * @route   POST /api/events/:eventCode/followup
 * @desc    Submit follow-up information (reconnect interest and optional contact info)
 * @access  Public
 */
router.post('/:eventCode/followup', async (req, res) => {
  try {
    const { eventCode } = req.params;
    const { participantId, reconnect, contactInfo } = req.body;

    // Validate required fields
    if (!participantId || reconnect === undefined) {
      return res.status(400).json({ message: 'Participant ID and reconnect decision are required' });
    }

    // Find event by code
    const event = await Event.findOne({ eventCode });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Verify participant exists
    const participant = await Participant.findOne({ 
      anonymousId: participantId, 
      eventId: event._id 
    });

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Check if participant has a match
    const match = await Match.findOne({
      eventId: event._id,
      $or: [
        { participant1Id: participantId },
        { participant2Id: participantId }
      ]
    });

    if (!match || !match.participant2Id) {
      return res.status(400).json({ message: 'Participant does not have a valid match' });
    }

    // Create or update follow-up
    const existingFollowUp = await FollowUp.findOne({
      eventId: event._id,
      participantId
    });

    if (existingFollowUp) {
      // Update existing follow-up
      existingFollowUp.reconnect = reconnect;
      if (reconnect && contactInfo) {
        existingFollowUp.contactInfo = contactInfo;
      }
      await existingFollowUp.save();
      res.json({ message: 'Follow-up updated successfully' });
    } else {
      // Create new follow-up
      const newFollowUp = new FollowUp({
        eventId: event._id,
        participantId,
        reconnect,
        contactInfo: reconnect ? contactInfo : undefined
      });
      await newFollowUp.save();
      res.status(201).json({ message: 'Follow-up submitted successfully' });
    }
  } catch (error) {
    console.error('Error submitting follow-up:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/events/:eventCode/followup/stats
 * @desc    Get anonymized follow-up statistics for host
 * @access  Public (should be restricted to host in production)
 */
router.get('/:eventCode/followup/stats', async (req, res) => {
  try {
    const { eventCode } = req.params;

    // Find event by code
    const event = await Event.findOne({ eventCode });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get all follow-ups for this event
    const followUps = await FollowUp.find({ eventId: event._id });
    
    // Calculate statistics
    const totalFollowUps = followUps.length;
    const wantToReconnect = followUps.filter(f => f.reconnect).length;
    const reconnectPercentage = totalFollowUps > 0 
      ? Math.round((wantToReconnect / totalFollowUps) * 100) 
      : 0;

    // Get all matches
    const matches = await Match.find({ 
      eventId: event._id,
      participant2Id: { $ne: null } // Only valid matches (not unmatched)
    });

    // Calculate mutual interest
    let mutualInterestCount = 0;
    for (const match of matches) {
      const participant1FollowUp = followUps.find(f => f.participantId === match.participant1Id);
      const participant2FollowUp = followUps.find(f => f.participantId === match.participant2Id);
      
      if (participant1FollowUp && participant2FollowUp && 
          participant1FollowUp.reconnect && participant2FollowUp.reconnect) {
        mutualInterestCount++;
      }
    }

    const mutualInterestPercentage = matches.length > 0 
      ? Math.round((mutualInterestCount / matches.length) * 100) 
      : 0;

    res.json({
      totalParticipants: event.participants.length,
      totalMatches: matches.length,
      totalFollowUps,
      wantToReconnect,
      reconnectPercentage: `${reconnectPercentage}%`,
      mutualInterestCount,
      mutualInterestPercentage: `${mutualInterestPercentage}%`
    });
  } catch (error) {
    console.error('Error fetching follow-up stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/events/:eventCode/followup/match
 * @desc    Check if match has mutual interest in reconnecting
 * @access  Public
 */
router.get('/:eventCode/followup/match', async (req, res) => {
  try {
    const { eventCode } = req.params;
    const { participantId } = req.query;

    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    // Find event by code
    const event = await Event.findOne({ eventCode });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Find participant's match
    const match = await Match.findOne({
      eventId: event._id,
      $or: [
        { participant1Id: participantId },
        { participant2Id: participantId }
      ]
    });

    if (!match || !match.participant2Id) {
      return res.status(404).json({ message: 'No match found for this participant' });
    }

    // Determine match's ID
    const matchParticipantId = match.participant1Id === participantId 
      ? match.participant2Id 
      : match.participant1Id;

    // Check if both participants want to reconnect
    const participantFollowUp = await FollowUp.findOne({
      eventId: event._id,
      participantId
    });

    const matchFollowUp = await FollowUp.findOne({
      eventId: event._id,
      participantId: matchParticipantId
    });

    const mutualInterest = participantFollowUp && matchFollowUp && 
                          participantFollowUp.reconnect && matchFollowUp.reconnect;

    // Only share contact info if there's mutual interest
    const response = {
      matchParticipantId,
      mutualInterest
    };

    if (mutualInterest) {
      response.matchContactInfo = matchFollowUp.contactInfo || 'No contact info provided';
    }

    res.json(response);
  } catch (error) {
    console.error('Error checking match follow-up:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
