const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const { generateEventCode, validateEventCode } = require('../utils/helpers');
const defaultQuestions = require('../utils/defaultQuestions');
const { generateEventQR } = require('../utils/qrCode');
const { authenticate, authorizeHost, verifyEventOwnership } = require('../middleware/auth');

/**
 * @route   POST /api/events
 * @desc    Create a new event
 * @access  Private/Host
 */
router.post('/', authenticate, authorizeHost, async (req, res) => {
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

    // Add event to user's events list
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { events: eventCode } }
    );

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
 * @route   GET /api/events/my-events
 * @desc    Get all events created by the authenticated user
 * @access  Private
 */
router.get('/my-events', authenticate, async (req, res) => {
  try {
    const eventCodes = req.user.events || [];
    
    if (eventCodes.length === 0) {
      return res.json([]);
    }
    
    const events = await Event.find({ eventCode: { $in: eventCodes } })
      .select('eventCode hostName countdownDuration participantCount startTime isActive createdAt');
    
    // Add participant count to each event
    const eventsWithStats = events.map(event => ({
      eventCode: event.eventCode,
      hostName: event.hostName,
      countdownDuration: event.countdownDuration,
      participantCount: event.participants.length,
      startTime: event.startTime,
      isActive: event.isActive,
      createdAt: event.createdAt
    }));
    
    res.json(eventsWithStats);
  } catch (error) {
    console.error('Error fetching user events:', error);
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
 * @access  Private/Host + Event Owner
 */
router.post('/:eventCode/start', authenticate, verifyEventOwnership, async (req, res) => {
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

/**
 * @route   GET /api/events/:eventCode/qrcode
 * @desc    Generate a QR code for joining an event
 * @access  Public
 */
router.get('/:eventCode/qrcode', async (req, res) => {
  try {
    const { eventCode } = req.params;

    // Validate event code format
    if (!validateEventCode(eventCode)) {
      return res.status(400).json({ message: 'Invalid event code format' });
    }

    // Find event by code to verify it exists
    const event = await Event.findOne({ eventCode });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get the base URL from request or use default
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    // Generate QR code
    const qrCode = await generateEventQR(eventCode, baseUrl);
    
    res.json({
      eventCode,
      qrCode: qrCode.dataUrl,
      joinUrl: qrCode.joinUrl
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

module.exports = router;
