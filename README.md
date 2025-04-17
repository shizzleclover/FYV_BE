# Find Your Vibe - Backend Documentation

## Overview
This is the backend implementation for the "Find Your Vibe" dating game web application. The backend provides API endpoints, real-time functionality, and a matchmaking algorithm for an interactive matchmaking event platform.

## Features
- Event creation and management
- Anonymous participant joining
- Questionnaire responses
- Outfit submission and voting
- Real-time lobby updates and countdown
- Matchmaking algorithm based on compatibility
- Private chat between matched participants
- Post-event follow-up system

## Tech Stack
- Node.js & Express - API server
- MongoDB & Mongoose - Database
- Socket.IO - Real-time communication
- JWT - Authentication (for future implementation)

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)

### Installation
1. Clone the repository
```
git clone <repository-url>
cd find-your-vibe
```

2. Install dependencies
```
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/find-your-vibe
NODE_ENV=development
```

4. Start the server
```
npm start
```

For development with auto-restart:
```
npm run dev
```

### Testing
Run the test suite:
```
npm test
```

## API Documentation

### Event Management

#### Create Event
- **URL**: `/api/events`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "hostName": "Sarah",
    "questions": [
      {
        "text": "Adventure or relaxation?",
        "options": ["Adventure", "Relaxation"]
      }
    ],
    "countdownDuration": 3600
  }
  ```
- **Response**:
  ```json
  {
    "message": "Event created successfully",
    "eventCode": "ABC123",
    "event": { ... }
  }
  ```

#### Get Event Details
- **URL**: `/api/events/:eventCode`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "eventCode": "ABC123",
    "hostName": "Sarah",
    "questions": [ ... ],
    "countdownDuration": 3600,
    "participantCount": 25,
    "startTime": "2023-11-15T20:00:00.000Z",
    "isActive": true,
    "createdAt": "2023-11-15T19:00:00.000Z"
  }
  ```

#### Start Event Countdown
- **URL**: `/api/events/:eventCode/start`
- **Method**: `POST`
- **Response**:
  ```json
  {
    "message": "Event started successfully",
    "startTime": "2023-11-15T20:00:00.000Z"
  }
  ```

### Participant Actions

#### Join Event
- **URL**: `/api/events/:eventCode/join`
- **Method**: `POST`
- **Response**:
  ```json
  {
    "message": "Joined event successfully",
    "anonymousId": "Player123",
    "eventCode": "ABC123"
  }
  ```

#### Submit Questionnaire Responses
- **URL**: `/api/events/:eventCode/responses`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "anonymousId": "Player123",
    "responses": [
      { "questionId": 0, "answer": "Adventure" },
      { "questionId": 1, "answer": "Morning person" }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "message": "Responses submitted successfully",
    "anonymousId": "Player123"
  }
  ```

#### Submit Outfit
- **URL**: `/api/events/:eventCode/outfit`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "anonymousId": "Player123",
    "outfit": "Red dress, gold shoes"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Outfit submitted successfully",
    "anonymousId": "Player123"
  }
  ```

### Voting System

#### Submit Vote
- **URL**: `/api/events/:eventCode/vote`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "voterId": "Player123",
    "outfitOwnerId": "Player456",
    "score": 4
  }
  ```
- **Response**:
  ```json
  {
    "message": "Vote submitted successfully"
  }
  ```

#### Get Leaderboard
- **URL**: `/api/events/:eventCode/leaderboard`
- **Method**: `GET`
- **Response**:
  ```json
  [
    {
      "anonymousId": "Player456",
      "outfit": "Red dress, gold shoes",
      "averageScore": 4.5,
      "voteCount": 10
    },
    ...
  ]
  ```

### Matchmaking

#### Trigger Matchmaking
- **URL**: `/api/events/:eventCode/reveal`
- **Method**: `POST`
- **Response**:
  ```json
  {
    "message": "Matchmaking completed successfully",
    "matchCount": 12
  }
  ```

#### Get Match
- **URL**: `/api/events/:eventCode/matches`
- **Method**: `GET`
- **Query Parameters**: `anonymousId=Player123`
- **Response**:
  ```json
  {
    "matched": true,
    "matchParticipantId": "Player456",
    "compatibilityScore": 20,
    "isWildCard": false,
    "outfit": "Red dress, gold shoes"
  }
  ```

### Follow-Up System

#### Submit Follow-Up
- **URL**: `/api/events/:eventCode/followup`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "participantId": "Player123",
    "reconnect": true,
    "contactInfo": "player123@example.com"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Follow-up submitted successfully"
  }
  ```

#### Get Follow-Up Stats
- **URL**: `/api/events/:eventCode/followup/stats`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "totalParticipants": 25,
    "totalMatches": 12,
    "totalFollowUps": 20,
    "wantToReconnect": 16,
    "reconnectPercentage": "80%",
    "mutualInterestCount": 7,
    "mutualInterestPercentage": "58%"
  }
  ```

#### Check Match Follow-Up
- **URL**: `/api/events/:eventCode/followup/match`
- **Method**: `GET`
- **Query Parameters**: `participantId=Player123`
- **Response**:
  ```json
  {
    "matchParticipantId": "Player456",
    "mutualInterest": true,
    "matchContactInfo": "player456@example.com"
  }
  ```

## Socket.IO Events

### Lobby Events

#### Client to Server
- `join-event`: Join event room
  ```javascript
  socket.emit('join-event', eventCode);
  ```
- `leave-event`: Leave event room
  ```javascript
  socket.emit('leave-event', eventCode);
  ```
- `start-countdown`: Start event countdown
  ```javascript
  socket.emit('start-countdown', { eventCode, duration });
  ```
- `update-leaderboard`: Update outfit leaderboard
  ```javascript
  socket.emit('update-leaderboard', { eventCode, leaderboard });
  ```
- `trigger-match-reveal`: Trigger match reveal for all participants
  ```javascript
  socket.emit('trigger-match-reveal', eventCode);
  ```

#### Server to Client
- `participant-update`: Participant count update
  ```javascript
  socket.on('participant-update', (data) => {
    console.log(`Participants: ${data.count}`);
  });
  ```
- `countdown-update`: Countdown timer update
  ```javascript
  socket.on('countdown-update', (data) => {
    console.log(`Remaining time: ${data.remainingTime}`);
  });
  ```
- `countdown-complete`: Countdown completed
  ```javascript
  socket.on('countdown-complete', () => {
    console.log('Countdown complete');
  });
  ```
- `leaderboard-update`: Leaderboard update
  ```javascript
  socket.on('leaderboard-update', (data) => {
    console.log('New leaderboard:', data.leaderboard);
  });
  ```
- `match-reveal`: Match reveal notification
  ```javascript
  socket.on('match-reveal', () => {
    console.log('Matches revealed');
  });
  ```

### Chat Events

#### Client to Server
- `join-chat`: Join private chat room
  ```javascript
  socket.emit('join-chat', { eventCode, matchId, participantId });
  ```
- `leave-chat`: Leave private chat room
  ```javascript
  socket.emit('leave-chat', { eventCode, matchId, participantId });
  ```
- `send-message`: Send message in private chat
  ```javascript
  socket.emit('send-message', { eventCode, matchId, senderId, content });
  ```
- `report-message`: Report inappropriate message
  ```javascript
  socket.emit('report-message', { eventCode, matchId, reporterId, messageTimestamp, reason });
  ```
- `typing-start`: Indicate typing started
  ```javascript
  socket.emit('typing-start', { eventCode, matchId, participantId });
  ```
- `typing-stop`: Indicate typing stopped
  ```javascript
  socket.emit('typing-stop', { eventCode, matchId, participantId });
  ```

#### Server to Client
- `chat-participant-joined`: Participant joined chat
  ```javascript
  socket.on('chat-participant-joined', (data) => {
    console.log(`${data.participantId} joined the chat`);
  });
  ```
- `chat-participant-left`: Participant left chat
  ```javascript
  socket.on('chat-participant-left', (data) => {
    console.log(`${data.participantId} left the chat`);
  });
  ```
- `chat-history`: Chat history
  ```javascript
  socket.on('chat-history', (data) => {
    console.log('Chat history:', data.messages);
  });
  ```
- `new-message`: New message received
  ```javascript
  socket.on('new-message', (message) => {
    console.log(`${message.senderId}: ${message.content}`);
  });
  ```
- `report-acknowledged`: Report acknowledgement
  ```javascript
  socket.on('report-acknowledged', (data) => {
    console.log('Report acknowledged');
  });
  ```
- `participant-typing`: Participant is typing
  ```javascript
  socket.on('participant-typing', (data) => {
    console.log(`${data.participantId} is typing...`);
  });
  ```
- `participant-stopped-typing`: Participant stopped typing
  ```javascript
  socket.on('participant-stopped-typing', (data) => {
    console.log(`${data.participantId} stopped typing`);
  });
  ```

## Project Structure
```
find-your-vibe/
├── server/
│   ├── index.js                 # Main server file
│   ├── models/                  # MongoDB schemas
│   │   ├── Event.js
│   │   ├── Participant.js
│   │   ├── Match.js
│   │   ├── Vote.js
│   │   └── FollowUp.js
│   ├── routes/                  # API routes
│   │   ├── events.js
│   │   ├── participants.js
│   │   ├── matches.js
│   │   ├── votes.js
│   │   └── followups.js
│   ├── sockets/                 # Socket.IO handlers
│   │   ├── lobby.js
│   │   └── chat.js
│   ├── utils/                   # Utility functions
│   │   └── helpers.js
│   └── tests/                   # Test scripts
│       ├── index.js
│       ├── api.test.js
│       ├── socket.test.js
│       └── matchmaking.test.js
├── .env                         # Environment variables
└── package.json                 # Project metadata and dependencies
```

## Deployment
The backend can be deployed to any Node.js hosting service such as:
- Heroku
- AWS Elastic Beanstalk
- DigitalOcean App Platform
- Vercel
- Render

For production deployment, make sure to:
1. Set up a production MongoDB database
2. Configure environment variables
3. Enable HTTPS
4. Set appropriate CORS restrictions

## Future Enhancements
- User authentication for hosts
- Image upload for outfits
- Enhanced moderation tools
- Analytics dashboard for hosts
- Mobile app integration

## License
[MIT License](LICENSE)
