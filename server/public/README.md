# Find Your Vibe Test Interface

This test interface allows you to interact with all the backend features of the "Find Your Vibe" dating game web app.

## Features

The interface includes sections for testing all key functionality:

1. **Host Controls**
   - Create events (with default or custom questions)
   - Get event details
   - Start event countdown

2. **Participant Actions**
   - Join events
   - Submit questionnaire responses
   - Submit outfit descriptions

3. **Voting System**
   - Vote for outfits
   - View leaderboard

4. **Matchmaking**
   - Trigger matchmaking (host only)
   - View your match

5. **Follow-Up System**
   - Submit follow-up preferences
   - Check if your match wants to reconnect
   - View follow-up statistics (host only)

6. **Real-time Features**
   - Event lobby with countdown timer
   - Private chat with your match

## How to Use

### Setup

1. Make sure the backend server is running on http://localhost:5000
2. Open the `index.html` file in your browser

### Testing Flow

For a complete test of all features, follow this sequence:

1. **Host an Event**
   - Go to "Host Controls" section
   - Create a new event (use default questions or create custom ones)
   - Note the event code that's generated

2. **Join as Participants**
   - Open another browser window/tab
   - Go to "Participant Actions" section
   - Join the event using the event code
   - Submit questionnaire responses
   - Submit an outfit description
   - Repeat with additional browser windows to simulate multiple participants

3. **Start the Event**
   - In the host window, go to "Host Controls"
   - Start the event countdown using the event code

4. **Vote on Outfits**
   - Go to "Voting System" section
   - Load outfits and vote on them
   - View the leaderboard to see scores

5. **Trigger Matchmaking**
   - In the host window, go to "Matchmaking" section
   - Trigger matchmaking using the event code

6. **View Matches**
   - In participant windows, go to "Matchmaking" section
   - View your match
   - Open chat with your match

7. **Submit Follow-Ups**
   - Go to "Follow-Up System" section
   - Submit follow-up preferences
   - Check if your match wants to reconnect

## Troubleshooting

- If you encounter connection issues, make sure the backend server is running
- Check the browser console for any error messages
- Ensure you're using the correct event code when joining events

## Notes

- This is a test interface and not intended for production use
- All data is stored in the backend database and will persist between sessions
- The interface uses Socket.IO for real-time features, so multiple users can interact simultaneously
