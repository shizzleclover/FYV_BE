const express = require('express');
const router = express.Router();
const Participant = require('../models/Participant');
const Event = require('../models/Event');
const { generateAnonymousId, validateEventCode } = require('../utils/helpers');
const { upload } = require('../utils/cloudinary');

/**
 * @route   POST /api/events/:eventCode/join
 * @desc    Join an event as a participant
 * @access  Public
 */
router.post('/:eventCode/join', async (req, res) => {
  try {
    const { eventCode } = req.params;
    const { displayName } = req.body;

    // Trim and clean up the event code
    const cleanEventCode = eventCode.trim();

    // Validate event code format
    if (!validateEventCode(cleanEventCode)) {
      return res.status(400).json({ 
        message: 'Invalid event code format',
        details: 'Event code should only contain alphanumeric characters and be 6 characters long'
      });
    }

    // Find event by code
    const event = await Event.findOne({ eventCode: cleanEventCode });

    if (!event) {
      return res.status(404).json({ 
        message: 'Event not found',
        details: `No event found with code "${cleanEventCode}"`
      });
    }

    if (!event.isActive) {
      return res.status(400).json({ message: 'This event is no longer active' });
    }

    // Generate a unique anonymous ID
    let anonymousId;
    let isUnique = false;
    
    while (!isUnique) {
      anonymousId = generateAnonymousId();
      // Check if anonymous ID already exists in this event
      const existingParticipant = await Participant.findOne({ 
        anonymousId,
        eventId: event._id
      });
      if (!existingParticipant) {
        isUnique = true;
      }
    }

    // Create new participant
    const newParticipant = new Participant({
      anonymousId,
      displayName: displayName || anonymousId, // Use custom name or default to anonymousId
      eventId: event._id,
      responses: [],
      isActive: true
    });

    const savedParticipant = await newParticipant.save();

    // Add participant to event
    event.participants.push(anonymousId);
    await event.save();

    res.status(201).json({
      message: 'Joined event successfully',
      anonymousId: savedParticipant.anonymousId,
      displayName: savedParticipant.displayName,
      eventCode: cleanEventCode
    });
  } catch (error) {
    console.error('Error joining event:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

/**
 * @route   POST /api/events/:eventCode/responses
 * @desc    Submit questionnaire responses
 * @access  Public
 */
router.post('/:eventCode/responses', async (req, res) => {
  try {
    const { eventCode } = req.params;
    const { anonymousId, responses } = req.body;

    // Validate required fields
    if (!anonymousId || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ message: 'Anonymous ID and responses array are required' });
    }

    // Find event by code
    const event = await Event.findOne({ eventCode });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Find participant
    const participant = await Participant.findOne({ 
      anonymousId,
      eventId: event._id
    });

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Validate responses format - each response must have questionId and answer fields
    for (const response of responses) {
      if (response.questionId === undefined || response.answer === undefined) {
        return res.status(400).json({ 
          message: 'Each response must have questionId and answer',
          received: response 
        });
      }
    }

    // Update participant responses
    participant.responses = responses;
    await participant.save();

    res.json({
      message: 'Responses submitted successfully',
      anonymousId
    });
  } catch (error) {
    console.error('Error submitting responses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/events/:eventCode/outfit
 * @desc    Submit outfit description and optional image
 * @access  Public
 */
router.post('/:eventCode/outfit', upload.single('outfitImage'), async (req, res) => {
  try {
    const { eventCode } = req.params;
    const { anonymousId, outfit } = req.body;

    // Validate required fields
    if (!anonymousId || !outfit) {
      return res.status(400).json({ message: 'Anonymous ID and outfit description are required' });
    }

    // Find event by code
    const event = await Event.findOne({ eventCode });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Find participant
    const participant = await Participant.findOne({ 
      anonymousId,
      eventId: event._id
    });

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Update participant outfit
    participant.outfit = outfit;
    
    // If there's an uploaded image, store its URL
    if (req.file && req.file.path) {
      participant.outfitImageUrl = req.file.path;
    }
    
    await participant.save();

    res.json({
      message: 'Outfit submitted successfully',
      anonymousId,
      outfitImageUrl: participant.outfitImageUrl
    });
  } catch (error) {
    console.error('Error submitting outfit:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
