const io = require('socket.io-client');
const axios = require('axios');

// Test configuration
const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';
const EVENT_CODE = 'TEST' + Math.floor(Math.random() * 900 + 100); // Random event code
const HOST_NAME = 'TestHost';

// Test data
const testEvent = {
  hostName: HOST_NAME,
  countdownDuration: 60 // 1 minute for testing
};

// Store test data
let createdEventCode;
let participantIds = [];
let sockets = [];

// Test functions
async function setupTestEvent() {
  try {
    console.log('\n--- Setting up test event ---');
    const response = await axios.post(`${API_URL}/events`, testEvent);
    
    createdEventCode = response.data.eventCode;
    console.log(`Event created with code: ${createdEventCode}`);
    
    // Add 3 participants
    for (let i = 0; i < 3; i++) {
      const joinResponse = await axios.post(`${API_URL}/events/${createdEventCode}/join`);
      participantIds.push(joinResponse.data.anonymousId);
    }
    
    console.log(`Added participants: ${participantIds.join(', ')}`);
    return true;
  } catch (error) {
    console.error('Error setting up test event:', error.response?.data || error.message);
    return false;
  }
}

async function testLobbySocket() {
  return new Promise((resolve) => {
    console.log('\n--- Testing Lobby Socket.IO ---');
    
    // Create socket connection
    const socket = io(SOCKET_URL);
    sockets.push(socket);
    
    socket.on('connect', () => {
      console.log('Socket connected');
      
      // Join event room
      socket.emit('join-event', createdEventCode);
      console.log(`Joined event: ${createdEventCode}`);
      
      // Listen for participant updates
      socket.on('participant-update', (data) => {
        console.log(`Participant update received: ${data.count} participants`);
      });
      
      // Listen for countdown updates
      socket.on('countdown-update', (data) => {
        console.log(`Countdown update: ${data.remainingTime} seconds remaining`);
      });
      
      // Listen for countdown completion
      socket.on('countdown-complete', () => {
        console.log('Countdown complete event received');
        
        // Test passed
        setTimeout(() => {
          resolve(true);
        }, 1000);
      });
      
      // Start countdown (shorter duration for testing)
      setTimeout(() => {
        socket.emit('start-countdown', {
          eventCode: createdEventCode,
          duration: 5 // 5 seconds for testing
        });
        console.log('Started countdown (5 seconds)');
      }, 1000);
    });
    
    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      resolve(false);
    });
    
    // Set timeout for test
    setTimeout(() => {
      console.error('Socket test timed out');
      resolve(false);
    }, 10000); // 10 second timeout
  });
}

async function testChatSocket() {
  return new Promise((resolve) => {
    console.log('\n--- Testing Chat Socket.IO ---');
    
    // Create two socket connections for the chat participants
    const socket1 = io(SOCKET_URL);
    const socket2 = io(SOCKET_URL);
    sockets.push(socket1, socket2);
    
    const matchId = 'test-match-123';
    const chatRoomId = `chat:${createdEventCode}:${matchId}`;
    
    let messagesReceived = 0;
    
    socket1.on('connect', () => {
      console.log('Socket 1 connected');
      
      // Join chat room
      socket1.emit('join-chat', {
        eventCode: createdEventCode,
        matchId: matchId,
        participantId: participantIds[0]
      });
      
      // Listen for new messages
      socket1.on('new-message', (message) => {
        console.log(`Socket 1 received message: ${message.content}`);
        messagesReceived++;
        
        // Test passed when both messages are received
        if (messagesReceived >= 2) {
          setTimeout(() => {
            resolve(true);
          }, 1000);
        }
      });
    });
    
    socket2.on('connect', () => {
      console.log('Socket 2 connected');
      
      // Join chat room
      socket2.emit('join-chat', {
        eventCode: createdEventCode,
        matchId: matchId,
        participantId: participantIds[1]
      });
      
      // Listen for new messages
      socket2.on('new-message', (message) => {
        console.log(`Socket 2 received message: ${message.content}`);
        messagesReceived++;
        
        // Test passed when both messages are received
        if (messagesReceived >= 2) {
          setTimeout(() => {
            resolve(true);
          }, 1000);
        }
      });
      
      // Send test messages after both sockets have joined
      setTimeout(() => {
        // Socket 1 sends a message
        socket1.emit('send-message', {
          eventCode: createdEventCode,
          matchId: matchId,
          senderId: participantIds[0],
          content: 'Hello from participant 1!'
        });
        
        // Socket 2 sends a message
        socket2.emit('send-message', {
          eventCode: createdEventCode,
          matchId: matchId,
          senderId: participantIds[1],
          content: 'Hello from participant 2!'
        });
        
        console.log('Test messages sent');
      }, 1000);
    });
    
    // Handle connection errors
    socket1.on('connect_error', (error) => {
      console.error('Socket 1 connection error:', error);
      resolve(false);
    });
    
    socket2.on('connect_error', (error) => {
      console.error('Socket 2 connection error:', error);
      resolve(false);
    });
    
    // Set timeout for test
    setTimeout(() => {
      console.error('Chat socket test timed out');
      resolve(false);
    }, 10000); // 10 second timeout
  });
}

async function testMatchRevealSocket() {
  return new Promise((resolve) => {
    console.log('\n--- Testing Match Reveal Socket.IO ---');
    
    // Create socket connection
    const socket = io(SOCKET_URL);
    sockets.push(socket);
    
    socket.on('connect', () => {
      console.log('Socket connected');
      
      // Join event room
      socket.emit('join-event', createdEventCode);
      console.log(`Joined event: ${createdEventCode}`);
      
      // Listen for match reveal
      socket.on('match-reveal', () => {
        console.log('Match reveal event received');
        
        // Test passed
        setTimeout(() => {
          resolve(true);
        }, 1000);
      });
      
      // Trigger match reveal
      setTimeout(() => {
        socket.emit('trigger-match-reveal', createdEventCode);
        console.log('Triggered match reveal');
      }, 1000);
    });
    
    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      resolve(false);
    });
    
    // Set timeout for test
    setTimeout(() => {
      console.error('Match reveal socket test timed out');
      resolve(false);
    }, 10000); // 10 second timeout
  });
}

// Clean up function
function cleanup() {
  console.log('\n--- Cleaning up ---');
  
  // Close all socket connections
  for (const socket of sockets) {
    if (socket.connected) {
      socket.disconnect();
    }
  }
  
  console.log('All sockets disconnected');
}

// Run all tests
async function runTests() {
  console.log('=== STARTING SOCKET.IO TESTS ===');
  
  try {
    // Setup test event first
    const setupSuccess = await setupTestEvent();
    if (!setupSuccess) {
      console.error('Failed to set up test event, aborting tests');
      return;
    }
    
    const tests = [
      { name: 'Lobby Socket', fn: testLobbySocket },
      { name: 'Chat Socket', fn: testChatSocket },
      { name: 'Match Reveal Socket', fn: testMatchRevealSocket }
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
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    cleanup();
  }
}

// Export for use in other files
module.exports = { runTests };

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}
