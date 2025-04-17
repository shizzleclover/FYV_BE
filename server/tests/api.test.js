const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Test configuration
const API_URL = 'http://localhost:5000/api';
const EVENT_CODE = 'TEST' + Math.floor(Math.random() * 900 + 100); // Random event code
const HOST_NAME = 'TestHost';

// Test data
const testEvent = {
  hostName: HOST_NAME,
  questions: [
    {
      text: "Coffee or tea?",
      options: ["Coffee", "Tea"]
    },
    {
      text: "Early bird or night owl?",
      options: ["Early bird", "Night owl"]
    }
  ],
  countdownDuration: 300 // 5 minutes
};

const testParticipants = [
  {
    responses: [
      { questionId: 0, answer: "Coffee" },
      { questionId: 1, answer: "Early bird" }
    ],
    outfit: "Blue jeans and white t-shirt"
  },
  {
    responses: [
      { questionId: 0, answer: "Coffee" },
      { questionId: 1, answer: "Night owl" }
    ],
    outfit: "Black dress and heels"
  },
  {
    responses: [
      { questionId: 0, answer: "Tea" },
      { questionId: 1, answer: "Early bird" }
    ],
    outfit: "Green sweater and khakis"
  }
];

// Store test data
let createdEventCode;
let participantIds = [];

// Test functions
async function testCreateEvent() {
  try {
    console.log('\n--- Testing Event Creation ---');
    const response = await axios.post(`${API_URL}/events`, testEvent);
    
    console.log(`Event created with code: ${response.data.eventCode}`);
    createdEventCode = response.data.eventCode;
    
    return true;
  } catch (error) {
    console.error('Error creating event:', error.response?.data || error.message);
    return false;
  }
}

async function testGetEventDetails() {
  try {
    console.log('\n--- Testing Get Event Details ---');
    const response = await axios.get(`${API_URL}/events/${createdEventCode}`);
    
    console.log('Event details:', response.data);
    
    return true;
  } catch (error) {
    console.error('Error getting event details:', error.response?.data || error.message);
    return false;
  }
}

async function testJoinEvent() {
  try {
    console.log('\n--- Testing Join Event (3 participants) ---');
    
    for (let i = 0; i < 3; i++) {
      const response = await axios.post(`${API_URL}/events/${createdEventCode}/join`);
      participantIds.push(response.data.anonymousId);
      console.log(`Participant ${i+1} joined with ID: ${response.data.anonymousId}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error joining event:', error.response?.data || error.message);
    return false;
  }
}

async function testSubmitResponses() {
  try {
    console.log('\n--- Testing Submit Responses ---');
    
    for (let i = 0; i < participantIds.length; i++) {
      const response = await axios.post(`${API_URL}/events/${createdEventCode}/responses`, {
        anonymousId: participantIds[i],
        responses: testParticipants[i].responses
      });
      
      console.log(`Participant ${participantIds[i]} submitted responses successfully`);
    }
    
    return true;
  } catch (error) {
    console.error('Error submitting responses:', error.response?.data || error.message);
    return false;
  }
}

async function testSubmitOutfits() {
  try {
    console.log('\n--- Testing Submit Outfits ---');
    
    for (let i = 0; i < participantIds.length; i++) {
      const response = await axios.post(`${API_URL}/events/${createdEventCode}/outfit`, {
        anonymousId: participantIds[i],
        outfit: testParticipants[i].outfit
      });
      
      console.log(`Participant ${participantIds[i]} submitted outfit: "${testParticipants[i].outfit}"`);
    }
    
    return true;
  } catch (error) {
    console.error('Error submitting outfits:', error.response?.data || error.message);
    return false;
  }
}

async function testVoting() {
  try {
    console.log('\n--- Testing Voting ---');
    
    // Each participant votes for others
    for (let i = 0; i < participantIds.length; i++) {
      for (let j = 0; j < participantIds.length; j++) {
        if (i !== j) { // Don't vote for yourself
          const score = Math.floor(Math.random() * 5) + 1; // Random score 1-5
          
          const response = await axios.post(`${API_URL}/events/${createdEventCode}/vote`, {
            voterId: participantIds[i],
            outfitOwnerId: participantIds[j],
            score
          });
          
          console.log(`Participant ${participantIds[i]} voted ${score} for ${participantIds[j]}'s outfit`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error voting:', error.response?.data || error.message);
    return false;
  }
}

async function testLeaderboard() {
  try {
    console.log('\n--- Testing Leaderboard ---');
    
    const response = await axios.get(`${API_URL}/events/${createdEventCode}/leaderboard`);
    
    console.log('Leaderboard:', response.data);
    
    return true;
  } catch (error) {
    console.error('Error getting leaderboard:', error.response?.data || error.message);
    return false;
  }
}

async function testStartEvent() {
  try {
    console.log('\n--- Testing Start Event ---');
    
    const response = await axios.post(`${API_URL}/events/${createdEventCode}/start`);
    
    console.log('Event started at:', response.data.startTime);
    
    return true;
  } catch (error) {
    console.error('Error starting event:', error.response?.data || error.message);
    return false;
  }
}

async function testMatchmaking() {
  try {
    console.log('\n--- Testing Matchmaking ---');
    
    const response = await axios.post(`${API_URL}/events/${createdEventCode}/reveal`);
    
    console.log('Matchmaking completed:', response.data);
    
    return true;
  } catch (error) {
    console.error('Error running matchmaking:', error.response?.data || error.message);
    return false;
  }
}

async function testGetMatches() {
  try {
    console.log('\n--- Testing Get Matches ---');
    
    for (const participantId of participantIds) {
      const response = await axios.get(`${API_URL}/events/${createdEventCode}/matches?anonymousId=${participantId}`);
      
      console.log(`Match for ${participantId}:`, response.data);
    }
    
    return true;
  } catch (error) {
    console.error('Error getting matches:', error.response?.data || error.message);
    return false;
  }
}

async function testFollowUp() {
  try {
    console.log('\n--- Testing Follow-Up ---');
    
    // Each participant submits follow-up
    for (const participantId of participantIds) {
      const reconnect = Math.random() > 0.3; // 70% chance of wanting to reconnect
      
      const response = await axios.post(`${API_URL}/events/${createdEventCode}/followup`, {
        participantId,
        reconnect,
        contactInfo: reconnect ? `${participantId}@example.com` : null
      });
      
      console.log(`Participant ${participantId} follow-up (reconnect: ${reconnect})`);
    }
    
    return true;
  } catch (error) {
    console.error('Error submitting follow-up:', error.response?.data || error.message);
    return false;
  }
}

async function testFollowUpStats() {
  try {
    console.log('\n--- Testing Follow-Up Stats ---');
    
    const response = await axios.get(`${API_URL}/events/${createdEventCode}/followup/stats`);
    
    console.log('Follow-up stats:', response.data);
    
    return true;
  } catch (error) {
    console.error('Error getting follow-up stats:', error.response?.data || error.message);
    return false;
  }
}

async function testFollowUpMatch() {
  try {
    console.log('\n--- Testing Follow-Up Match Check ---');
    
    for (const participantId of participantIds) {
      const response = await axios.get(`${API_URL}/events/${createdEventCode}/followup/match?participantId=${participantId}`);
      
      console.log(`Follow-up match check for ${participantId}:`, response.data);
    }
    
    return true;
  } catch (error) {
    console.error('Error checking follow-up match:', error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('=== STARTING API TESTS ===');
  
  const tests = [
    { name: 'Create Event', fn: testCreateEvent },
    { name: 'Get Event Details', fn: testGetEventDetails },
    { name: 'Join Event', fn: testJoinEvent },
    { name: 'Submit Responses', fn: testSubmitResponses },
    { name: 'Submit Outfits', fn: testSubmitOutfits },
    { name: 'Voting', fn: testVoting },
    { name: 'Leaderboard', fn: testLeaderboard },
    { name: 'Start Event', fn: testStartEvent },
    { name: 'Matchmaking', fn: testMatchmaking },
    { name: 'Get Matches', fn: testGetMatches },
    { name: 'Follow-Up', fn: testFollowUp },
    { name: 'Follow-Up Stats', fn: testFollowUpStats },
    { name: 'Follow-Up Match Check', fn: testFollowUpMatch }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    console.log(`\nRunning test: ${test.name}`);
    const success = await test.fn();
    
    if (success) {
      console.log(`✅ ${test.name} - PASSED`);
      passedTests++;
    } else {
      console.log(`❌ ${test.name} - FAILED`);
    }
  }
  
  console.log(`\n=== TEST SUMMARY ===`);
  console.log(`Passed: ${passedTests}/${tests.length}`);
  console.log(`Success rate: ${Math.round((passedTests / tests.length) * 100)}%`);
}

// Export for use in other files
module.exports = { runTests };

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}
