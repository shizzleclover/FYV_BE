const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Load environment variables
dotenv.config();

// Load Swagger document
const swaggerDocument = YAML.load(path.join(__dirname, '..', 'swagger.yaml'));

// Import routes
const eventRoutes = require('./routes/events');
const participantRoutes = require('./routes/participants');
const matchRoutes = require('./routes/matches');
const voteRoutes = require('./routes/votes');
const followUpRoutes = require('./routes/followups');
const authRoutes = require('./routes/auth');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // In production, restrict to specific origins
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/find-your-vibe';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/events', participantRoutes);
app.use('/api/events', matchRoutes);
app.use('/api/events', voteRoutes);
app.use('/api/events', followUpRoutes);

// Basic route for testing
app.get('/api', (req, res) => {
  res.send('Find Your Vibe API is running');
});

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle QR code join routes
app.get('/join/:eventCode', (req, res) => {
  const { eventCode } = req.params;
  res.redirect(`/?join=${eventCode}`);
});

// Socket.IO setup
console.log('Setting up Socket.IO server');
require('./sockets/lobby')(io);
require('./sockets/chat')(io);

// Socket connection debug info
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Print active connections every minute
setInterval(() => {
  const sockets = io.sockets.sockets;
  console.log(`Active socket connections: ${sockets.size}`);
}, 60000);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };
