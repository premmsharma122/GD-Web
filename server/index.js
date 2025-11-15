require('dotenv').config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose"); // Required for Mongoose models
const { Server } = require("socket.io");
const dbConnect = require('./utils/dbConnect'); // Ensure dbConnect is included for controllers to work

const roomRoutes = require("./routes/roomRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const socketHandler = require("./socketHandler");

const app = express();
const server = http.createServer(app);

// CORS configuration (Ensure CLIENT_ORIGIN is set in Vercel ENV vars)
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "https://wonderful-dasik-d7b0f9.netlify.app",
    credentials: true,
  })
);

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Test AssemblyAI configuration
// NOTE: This route should also be checked for any dependencies that need 'dbConnect'
app.get('/api/test-assemblyai', async (req, res) => {
  // If this route saves data or loads models, add await dbConnect(); here
  // Otherwise, leave as is.
  try {
    const axios = require('axios');
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    // ... rest of the logic
  } catch (error) {
    // ...
  }
});

// API routes
app.use("/api/rooms", roomRoutes);
app.use("/api/analysis", analysisRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: err.message 
  });
});

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize socket handlers
socketHandler(io);

// VERCEL EXPORT
module.exports = server;