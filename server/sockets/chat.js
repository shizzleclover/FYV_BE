/**
 * Socket.IO handlers for private chat
 * Manages real-time private messaging between matched participants
 */

module.exports = function(io) {
  // Store active chat sessions
  const chatSessions = {};

  // Debug active sessions
  setInterval(() => {
    console.log('Active chat sessions:', Object.keys(chatSessions).length);
    Object.keys(chatSessions).forEach(roomId => {
      console.log(`- ${roomId}: ${chatSessions[roomId].participants.size} participants, ${chatSessions[roomId].messages.length} messages`);
    });
  }, 60000); // Log every minute

  io.on('connection', (socket) => {
    console.log('New client connected to chat, socket id:', socket.id);

    // Join private chat room
    socket.on('join-chat', ({ eventCode, matchId, participantId, displayName }) => {
      if (!eventCode || !matchId || !participantId) {
        console.error('Invalid join-chat parameters:', { eventCode, matchId, participantId });
        return;
      }
      
      const chatRoomId = `chat:${eventCode}:${matchId}`;
      socket.join(chatRoomId);
      console.log(`Participant ${displayName || participantId} joined chat room: ${chatRoomId}`);
      
      // Initialize chat session if not exists
      if (!chatSessions[chatRoomId]) {
        console.log(`Creating new chat session for room: ${chatRoomId}`);
        chatSessions[chatRoomId] = {
          participants: new Map(), // Using Map to store participantId -> displayName
          messages: []
        };
      }
      
      // Add participant to session with their display name
      chatSessions[chatRoomId].participants.set(participantId, displayName || participantId);
      console.log(`Chat room ${chatRoomId} now has ${chatSessions[chatRoomId].participants.size} participants`);
      
      // Notify room that participant joined
      socket.to(chatRoomId).emit('chat-participant-joined', {
        participantId,
        displayName: displayName || participantId,
        timestamp: new Date()
      });
      
      // Send chat history to the joining participant
      socket.emit('chat-history', {
        messages: chatSessions[chatRoomId].messages
      });
    });

    // Leave private chat room
    socket.on('leave-chat', ({ eventCode, matchId, participantId }) => {
      if (!eventCode || !matchId || !participantId) return;
      
      const chatRoomId = `chat:${eventCode}:${matchId}`;
      socket.leave(chatRoomId);
      
      // Get display name before removing from session
      let displayName = participantId;
      if (chatSessions[chatRoomId] && chatSessions[chatRoomId].participants.has(participantId)) {
        displayName = chatSessions[chatRoomId].participants.get(participantId);
      }
      
      console.log(`Participant ${displayName} left chat room: ${chatRoomId}`);
      
      // Remove participant from session if exists
      if (chatSessions[chatRoomId]) {
        chatSessions[chatRoomId].participants.delete(participantId);
        
        // Notify room that participant left
        socket.to(chatRoomId).emit('chat-participant-left', {
          participantId,
          displayName,
          timestamp: new Date()
        });
        
        // Clean up empty chat sessions
        if (chatSessions[chatRoomId].participants.size === 0) {
          delete chatSessions[chatRoomId];
        }
      }
    });

    // Send message in private chat
    socket.on('send-message', ({ eventCode, matchId, senderId, content }) => {
      if (!eventCode || !matchId || !senderId || !content) {
        console.error('Invalid send-message parameters:', { eventCode, matchId, senderId, hasContent: !!content });
        return;
      }
      
      const chatRoomId = `chat:${eventCode}:${matchId}`;
      console.log(`Message received for room ${chatRoomId} from ${senderId}`);
      
      // Check if the chat room exists
      if (!chatSessions[chatRoomId]) {
        console.warn(`Chat room ${chatRoomId} does not exist, creating it`);
        chatSessions[chatRoomId] = {
          participants: new Map(),
          messages: []
        };
      }
      
      // Get sender's display name
      let displayName = senderId;
      if (chatSessions[chatRoomId].participants.has(senderId)) {
        displayName = chatSessions[chatRoomId].participants.get(senderId);
      }
      
      // Create message object
      const message = {
        senderId,
        displayName,
        content,
        timestamp: new Date()
      };
      
      // Store message in session history
      chatSessions[chatRoomId].messages.push(message);
      
      // Limit history to last 100 messages
      if (chatSessions[chatRoomId].messages.length > 100) {
        chatSessions[chatRoomId].messages.shift();
      }
      
      // Broadcast message to room
      console.log(`Broadcasting message to room ${chatRoomId}`);
      io.to(chatRoomId).emit('new-message', message);
    });

    // Report inappropriate message
    socket.on('report-message', ({ eventCode, matchId, reporterId, messageTimestamp, reason }) => {
      if (!eventCode || !matchId || !reporterId || !messageTimestamp) return;
      
      const chatRoomId = `chat:${eventCode}:${matchId}`;
      
      // Find reported message
      let reportedMessage = null;
      if (chatSessions[chatRoomId]) {
        reportedMessage = chatSessions[chatRoomId].messages.find(
          msg => msg.timestamp.getTime() === new Date(messageTimestamp).getTime()
        );
      }
      
      // Log report (in production, store in database and notify moderators)
      console.log(`REPORT in ${chatRoomId}: Reporter: ${reporterId}, Reason: ${reason || 'Not specified'}`);
      console.log(`Reported message:`, reportedMessage);
      
      // Acknowledge report
      socket.emit('report-acknowledged', {
        messageTimestamp,
        timestamp: new Date()
      });
    });

    // Typing indicator
    socket.on('typing-start', ({ eventCode, matchId, participantId }) => {
      if (!eventCode || !matchId || !participantId) return;
      
      const chatRoomId = `chat:${eventCode}:${matchId}`;
      socket.to(chatRoomId).emit('participant-typing', { participantId });
    });

    socket.on('typing-stop', ({ eventCode, matchId, participantId }) => {
      if (!eventCode || !matchId || !participantId) return;
      
      const chatRoomId = `chat:${eventCode}:${matchId}`;
      socket.to(chatRoomId).emit('participant-stopped-typing', { participantId });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected from chat, socket id:', socket.id);
      // Note: Socket.IO automatically handles leaving rooms on disconnect
    });
  });
};
