const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { generateEventCode, validateEventCode } = require('../utils/helpers');
const defaultQuestions = require('../utils/defaultQuestions');

/**
 * @route   POST /api/events
 * @desc    Create a new event
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { hostName, questions, countdownDuration } = req.body;

    // Validate required fields
    if (!hostName) {
      return res.status(400).json({ message: 'Host name is required' });
    }

    // Validate questions format if provided
    if (questions && (!Array.isArray(questions) || questions.length === 0)) {
      return res.status(400).json({ message: 'Questions must be a non-empty array' });
    }

    // Generate a unique event code
    let eventCode;
    let isUnique = false;
    
    while (!isUnique) {
      eventCode = generateEventCode();
      // Check if event code already exists
      const existingEvent = await Event.findOne({ eventCode });
      if (!existingEvent) {
        isUnique = true;
      }
    }

    // Create new event
    const newEvent = new Event({
      eventCode,
      hostName,
      questions: questions || defaultQuestions,
      countdownDuration: countdownDuration || 3600, // Default: 1 hour
      participants: []
    });

    const savedEvent = await newEvent.save();

    res.status(201).json({
      message: 'Event created successfully',
      eventCode: savedEvent.eventCode,
      event: savedEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/events/:eventCode
 * @desc    Get event details by event code
 * @access  Public
 */
router.get('/:eventCode', async (req, res) => {
  try {
    const { eventCode } = req.params;

    // Validate event code format
    if (!validateEventCode(eventCode)) {
      return res.status(400).json({ message: 'Invalid event code format' });
    }

    // Find event by code
    const event = await Event.findOne({ eventCode });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Return event details (excluding sensitive data)
    res.json({
      eventCode: event.eventCode,
      hostName: event.hostName,
      questions: event.questions,
      countdownDuration: event.countdownDuration,
      participantCount: event.participants.length,
      startTime: event.startTime,
      isActive: event.isActive,
      createdAt: event.createdAt
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/events/:eventCode/start
 * @desc    Start the event countdown (host only)
 * @access  Public (should be restricted in production)
 */
router.post('/:eventCode/start', async (req, res) => {
  try {
    const { eventCode } = req.params;

    // Validate event code format
    if (!validateEventCode(eventCode)) {
      return res.status(400).json({ message: 'Invalid event code format' });
    }

    // Find event by code
    const event = await Event.findOne({ eventCode });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Set start time to now
    event.startTime = new Date();
    await event.save();

    res.json({
      message: 'Event started successfully',
      startTime: event.startTime
    });
  } catch (error) {
    console.error('Error starting event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
