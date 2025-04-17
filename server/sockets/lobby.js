/**
 * Socket.IO handlers for event lobby
 * Manages real-time updates for countdown, participant count, and leaderboard
 */

module.exports = function(io) {
  // Create namespace for events
  const events = {};

  io.on('connection', (socket) => {
    console.log('New client connected to lobby');

    // Join event room
    socket.on('join-event', (eventCode) => {
      if (!eventCode) return;
      
      socket.join(`event:${eventCode}`);
      console.log(`Client joined event: ${eventCode}`);
      
      // Initialize event countdown if not already running
      if (!events[eventCode]) {
        events[eventCode] = {
          participants: new Set(),
          countdownInterval: null,
          remainingTime: 0
        };
      }
      
      // Update participant count
      io.to(`event:${eventCode}`).emit('participant-update', {
        count: io.sockets.adapter.rooms.get(`event:${eventCode}`).size
      });
    });

    // Leave event room
    socket.on('leave-event', (eventCode) => {
      if (!eventCode) return;
      
      socket.leave(`event:${eventCode}`);
      console.log(`Client left event: ${eventCode}`);
      
      // Update participant count if room still exists
      const room = io.sockets.adapter.rooms.get(`event:${eventCode}`);
      if (room) {
        io.to(`event:${eventCode}`).emit('participant-update', {
          count: room.size
        });
      }
    });

    // Start countdown for an event
    socket.on('start-countdown', ({ eventCode, duration }) => {
      if (!eventCode || !duration) return;
      
      // Clear any existing countdown
      if (events[eventCode] && events[eventCode].countdownInterval) {
        clearInterval(events[eventCode].countdownInterval);
      }
      
      // Set initial remaining time
      events[eventCode] = {
        ...events[eventCode],
        remainingTime: duration
      };
      
      // Emit initial countdown
      io.to(`event:${eventCode}`).emit('countdown-update', {
        remainingTime: events[eventCode].remainingTime
      });
      
      // Start countdown interval
      events[eventCode].countdownInterval = setInterval(() => {
        events[eventCode].remainingTime -= 1;
        
        // Emit countdown update
        io.to(`event:${eventCode}`).emit('countdown-update', {
          remainingTime: events[eventCode].remainingTime
        });
        
        // Stop countdown when it reaches zero
        if (events[eventCode].remainingTime <= 0) {
          clearInterval(events[eventCode].countdownInterval);
          events[eventCode].countdownInterval = null;
          
          // Emit countdown complete event
          io.to(`event:${eventCode}`).emit('countdown-complete');
        }
      }, 1000);
    });

    // Update leaderboard
    socket.on('update-leaderboard', ({ eventCode, leaderboard }) => {
      if (!eventCode || !leaderboard) return;
      
      io.to(`event:${eventCode}`).emit('leaderboard-update', { leaderboard });
    });

    // Trigger match reveal
    socket.on('trigger-match-reveal', (eventCode) => {
      if (!eventCode) return;
      
      io.to(`event:${eventCode}`).emit('match-reveal');
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected from lobby');
    });
  });
};
