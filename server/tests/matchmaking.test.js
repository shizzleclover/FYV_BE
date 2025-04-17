const Match = require('../models/Match');
const mongoose = require('mongoose');

/**
 * Test the matchmaking algorithm with sample participants
 */
async function testMatchmakingAlgorithm() {
  console.log('=== TESTING MATCHMAKING ALGORITHM ===');
  
  // Create test event ID
  const testEventId = new mongoose.Types.ObjectId();
  
  // Create test participants with responses
  const testParticipants = [
    {
      anonymousId: 'Player101',
      responses: [
        { questionId: 0, answer: 'Talk it out immediately' },
        { questionId: 1, answer: 'Physical touch' },
        { questionId: 2, answer: 'Go on a spontaneous adventure' }
      ]
    },
    {
      anonymousId: 'Player102',
      responses: [
        { questionId: 0, answer: 'Talk it out immediately' },
        { questionId: 1, answer: 'Quality time' },
        { questionId: 2, answer: 'Stay in and relax' }
      ]
    },
    {
      anonymousId: 'Player103',
      responses: [
        { questionId: 0, answer: 'Take time to think before responding' },
        { questionId: 1, answer: 'Words of affirmation' },
        { questionId: 2, answer: 'Meet up with friends' }
      ]
    },
    {
      anonymousId: 'Player104',
      responses: [
        { questionId: 0, answer: 'Take time to think before responding' },
        { questionId: 1, answer: 'Words of affirmation' },
        { questionId: 2, answer: 'Work on a personal project' }
      ]
    },
    {
      anonymousId: 'Player105',
      responses: [
        { questionId: 0, answer: 'Joke about it to lighten the mood' },
        { questionId: 1, answer: 'Acts of service' },
        { questionId: 2, answer: 'Go on a spontaneous adventure' }
      ]
    }
  ];
  
  try {
    // Import the matches.js file to access the runMatchmakingAlgorithm function
    const matchesRouter = require('../routes/matches');
    
    // Extract the runMatchmakingAlgorithm function
    const runMatchmakingAlgorithm = matchesRouter.runMatchmakingAlgorithm;
    
    if (typeof runMatchmakingAlgorithm === 'function') {
      // Run the algorithm with test data
      const matches = await runMatchmakingAlgorithm(testEventId, testParticipants);
      
      console.log(`Created ${matches.length} matches`);
      
      // Check if all participants are matched
      const matchedParticipants = new Set();
      for (const match of matches) {
        if (match.participant1Id) matchedParticipants.add(match.participant1Id);
        if (match.participant2Id) matchedParticipants.add(match.participant2Id);
      }
      
      console.log(`Matched participants: ${matchedParticipants.size}/${testParticipants.length}`);
      
      // Check compatibility scores
      for (const match of matches) {
        if (match.participant2Id) { // Only check complete matches
          console.log(`Match: ${match.participant1Id} + ${match.participant2Id}, Score: ${match.compatibilityScore}`);
        } else {
          console.log(`Unmatched participant: ${match.participant1Id}`);
        }
      }
      
      // Check if odd number of participants is handled correctly
      if (testParticipants.length % 2 !== 0) {
        const unmatchedCount = matches.filter(m => !m.participant2Id).length;
        console.log(`Odd number of participants: ${unmatchedCount} participant(s) unmatched`);
        if (unmatchedCount === 1) {
          console.log('✅ Odd number handling correct');
        } else {
          console.log('❌ Odd number handling incorrect');
        }
      }
      
      console.log('\n=== MATCHMAKING TEST COMPLETE ===');
      return matches;
    } else {
      console.error('Error: runMatchmakingAlgorithm function not found or not exported');
      return [];
    }
  } catch (error) {
    console.error('Error testing matchmaking algorithm:', error);
    return [];
  }
}

// Export for use in other files
module.exports = { testMatchmakingAlgorithm };
