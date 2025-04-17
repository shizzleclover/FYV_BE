const apiTest = require('./api.test');
const socketTest = require('./socket.test');
const matchmakingTest = require('./matchmaking.test');

// Run all tests
async function runAllTests() {
  console.log('======================================');
  console.log('=== FIND YOUR VIBE BACKEND TESTS ====');
  console.log('======================================\n');
  
  try {
    // Run API tests
    console.log('\n\n=== RUNNING API TESTS ===\n');
    await apiTest.runTests();
    
    // Run Socket.IO tests
    console.log('\n\n=== RUNNING SOCKET.IO TESTS ===\n');
    await socketTest.runTests();
    
    // Run matchmaking algorithm tests
    console.log('\n\n=== RUNNING MATCHMAKING ALGORITHM TESTS ===\n');
    await matchmakingTest.testMatchmakingAlgorithm();
    
    console.log('\n\n======================================');
    console.log('=== ALL TESTS COMPLETED ===');
    console.log('======================================');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
