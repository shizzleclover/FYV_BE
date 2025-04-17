const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Event = require('../models/Event');
const Participant = require('../models/Participant');

/**
 * @route   POST /api/events/:eventCode/reveal
 * @desc    Trigger matchmaking algorithm (host only)
 * @access  Public (should be restricted to host in production)
 */
router.post('/:eventCode/reveal', async (req, res) => {
  try {
    const { eventCode } = req.params;
    const { force } = req.body; // Add a force parameter to allow re-triggering
    console.log(`Attempting to trigger matchmaking for event: ${eventCode}, force: ${force}`);

    // Find event by code
    const event = await Event.findOne({ eventCode });
    if (!event) {
      console.log(`Event not found: ${eventCode}`);
      return res.status(404).json({ message: 'Event not found' });
    }
    
    console.log(`Event found: ${event._id}, checking participants...`);

    // Get all participants with responses
    const participants = await Participant.find({
      eventId: event._id,
      responses: { $exists: true, $ne: [] }
    });
    
    console.log(`Found ${participants.length} participants with responses`);

    if (participants.length < 2) {
      console.log(`Not enough participants with responses (needed: 2, found: ${participants.length})`);
      return res.status(400).json({ 
        message: `Not enough participants with responses for matchmaking (needed: 2, found: ${participants.length})` 
      });
    }

    // Check if matchmaking has already been done
    const existingMatches = await Match.find({ eventId: event._id });
    console.log(`Found ${existingMatches.length} existing matches`);
    
    if (existingMatches.length > 0 && !force) {
      console.log(`Matchmaking already performed for event: ${eventCode}`);
      return res.status(400).json({ 
        message: 'Matchmaking has already been performed for this event. Use force=true to re-trigger.' 
      });
    }

    // If force is true and there are existing matches, delete them first
    if (existingMatches.length > 0 && force) {
      console.log(`Force flag is true. Deleting ${existingMatches.length} existing matches before re-matching`);
      await Match.deleteMany({ eventId: event._id });
    }

    // Run matchmaking algorithm
    console.log(`Running matchmaking algorithm for ${participants.length} participants`);
    const matches = await runMatchmakingAlgorithm(event._id, participants);
    console.log(`Matchmaking completed successfully, created ${matches.length} matches`);

    res.status(201).json({
      message: 'Matchmaking completed successfully',
      matchCount: matches.length
    });
  } catch (error) {
    console.error('Error running matchmaking:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/events/:eventCode/matches
 * @desc    Get match for a participant
 * @access  Public
 */
router.get('/:eventCode/matches', async (req, res) => {
  try {
    const { eventCode } = req.params;
    const { anonymousId } = req.query;

    if (!anonymousId) {
      return res.status(400).json({ message: 'Anonymous ID is required' });
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
        { participant1Id: anonymousId },
        { participant2Id: anonymousId }
      ]
    });

    if (!match) {
      return res.status(404).json({ message: 'No match found for this participant' });
    }

    // Determine match's ID
    let matchParticipantId = null;
    let isWildCard = false;

    if (match.participant1Id === anonymousId) {
      matchParticipantId = match.participant2Id;
    } else {
      matchParticipantId = match.participant1Id;
    }

    // Check if this is a wild card match (unmatched participant)
    if (!matchParticipantId) {
      return res.json({
        matched: false,
        message: 'You are unmatched in this round'
      });
    }

    isWildCard = match.isWildCard;

    // Get match's outfit if available
    const matchParticipant = await Participant.findOne({
      anonymousId: matchParticipantId,
      eventId: event._id
    });

    const outfit = matchParticipant ? matchParticipant.outfit : null;
    const displayName = matchParticipant ? matchParticipant.displayName || matchParticipantId : matchParticipantId;

    res.json({
      matched: true,
      matchParticipantId,
      displayName,
      compatibilityScore: match.compatibilityScore,
      isWildCard,
      outfit
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Run matchmaking algorithm to pair participants
 * @param {ObjectId} eventId - Event ID
 * @param {Array} participants - Array of participant objects
 * @returns {Array} Array of created match objects
 */
async function runMatchmakingAlgorithm(eventId, participants) {
  // Calculate compatibility scores between all pairs
  const compatibilityScores = [];

  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      const participant1 = participants[i];
      const participant2 = participants[j];
      
      // Calculate compatibility score based on the enhanced algorithm
      let score = 0;
      let matchedAnswers = 0;
      let totalQuestions = 0;
      let isCompatibleOrientation = true;
      let isCompatibleRelationshipGoal = true;
      
      // 0. Check Sexual Orientation Compatibility - This is a deal-breaker
      const orientationResponse1 = participant1.responses.find(r => r.questionId === 0);
      const orientationResponse2 = participant2.responses.find(r => r.questionId === 0);
      
      if (orientationResponse1 && orientationResponse2) {
        // If someone is only attracted to men
        if (orientationResponse1.answer === "Men") {
          // They shouldn't match with someone only attracted to men
          if (orientationResponse2.answer === "Men") {
            isCompatibleOrientation = false;
          }
        }
        // If someone is only attracted to women
        else if (orientationResponse1.answer === "Women") {
          // They shouldn't match with someone only attracted to women
          if (orientationResponse2.answer === "Women") {
            isCompatibleOrientation = false;
          }
        }
        // Both men and women or open to all are compatible with everyone
      }
      
      // 1. Check Relationship Goal Compatibility
      const relationshipResponse1 = participant1.responses.find(r => r.questionId === 1);
      const relationshipResponse2 = participant2.responses.find(r => r.questionId === 1);
      
      if (relationshipResponse1 && relationshipResponse2) {
        // If the goals don't match exactly, but one wants friendship only
        if (relationshipResponse1.answer !== relationshipResponse2.answer) {
          // If one person only wants friendship but the other wants something else
          if (relationshipResponse1.answer === "Friendship only" || 
              relationshipResponse2.answer === "Friendship only") {
            isCompatibleRelationshipGoal = false;
          }
        }
        
        // If they match on relationship goals, give a big bonus
        if (relationshipResponse1.answer === relationshipResponse2.answer) {
          score += 30;
        }
      }

      // Skip this pairing if orientations or relationship goals aren't compatible
      if (!isCompatibleOrientation || !isCompatibleRelationshipGoal) {
        continue;
      }
      
      // 2. Personality Compatibility - Compare responses to other questions
      for (const response1 of participant1.responses) {
        // Skip the orientation and relationship questions as we've already handled them
        if (response1.questionId <= 1) continue;
        
        const response2 = participant2.responses.find(r => r.questionId === response1.questionId);
        
        if (response2) {
          totalQuestions++;
          
          if (response1.answer === response2.answer) {
            // +10 points for matching answers
            score += 10;
            matchedAnswers++;
          }
        }
      }
      
      // 3. Calculate percentage match for better weighting
      const matchPercentage = totalQuestions > 0 ? (matchedAnswers / totalQuestions) * 100 : 0;
      
      // 4. Boost scores for high compatibility matches
      if (matchPercentage > 70) {
        score += 15; // Bonus for high compatibility
      }
      
      // 5. Add a small random factor (10-15% as mentioned in requirements)
      // This keeps matches interesting and prevents overly predictable pairings
      const randomFactor = Math.floor(Math.random() * 15); // 0-14 random points
      score += randomFactor;
      
      compatibilityScores.push({
        participant1Id: participant1.anonymousId,
        participant2Id: participant2.anonymousId,
        score,
        matchPercentage
      });
    }
  }
  
  // Sort by score (highest first)
  compatibilityScores.sort((a, b) => b.score - a.score);
  
  // Create matches based on highest compatibility
  const matches = [];
  const matchedParticipants = new Set();
  
  // First pass: create matches based on compatibility scores
  for (const pair of compatibilityScores) {
    if (!matchedParticipants.has(pair.participant1Id) && 
        !matchedParticipants.has(pair.participant2Id)) {
      
      // Create a new match
      const newMatch = new Match({
        eventId,
        participant1Id: pair.participant1Id,
        participant2Id: pair.participant2Id,
        compatibilityScore: pair.score,
        isWildCard: false
      });
      
      const savedMatch = await newMatch.save();
      matches.push(savedMatch);
      
      // Mark participants as matched
      matchedParticipants.add(pair.participant1Id);
      matchedParticipants.add(pair.participant2Id);
    }
  }
  
  // Handle odd number of participants or leftovers
  const unmatchedParticipants = participants.filter(p => 
    !matchedParticipants.has(p.anonymousId)
  );
  
  if (unmatchedParticipants.length === 1) {
    // Single unmatched participant
    const unmatched = unmatchedParticipants[0];
    
    // Create a match with null participant2Id
    const newMatch = new Match({
      eventId,
      participant1Id: unmatched.anonymousId,
      participant2Id: null,
      compatibilityScore: 0,
      isWildCard: false
    });
    
    const savedMatch = await newMatch.save();
    matches.push(savedMatch);
  } else if (unmatchedParticipants.length > 1) {
    // Multiple unmatched participants - create wild card matches
    for (let i = 0; i < unmatchedParticipants.length; i += 2) {
      if (i + 1 < unmatchedParticipants.length) {
        // Create a wild card match
        const newMatch = new Match({
          eventId,
          participant1Id: unmatchedParticipants[i].anonymousId,
          participant2Id: unmatchedParticipants[i + 1].anonymousId,
          compatibilityScore: 0,
          isWildCard: true
        });
        
        const savedMatch = await newMatch.save();
        matches.push(savedMatch);
      } else {
        // Last unmatched participant
        const newMatch = new Match({
          eventId,
          participant1Id: unmatchedParticipants[i].anonymousId,
          participant2Id: null,
          compatibilityScore: 0,
          isWildCard: false
        });
        
        const savedMatch = await newMatch.save();
        matches.push(savedMatch);
      }
    }
  }
  
  return matches;
}

// Export the router and the matchmaking algorithm for testing
module.exports = router;
module.exports.runMatchmakingAlgorithm = runMatchmakingAlgorithm;
