require('dotenv').config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose"); // Required for Mongoose models
const { Server } = require("socket.io");

const roomRoutes = require("./routes/roomRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const socketHandler = require("./socketHandler");

const app = express();
const server = http.createServer(app);

// CORS configuration 
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "https://wonderful-dasik-d7b0f9.netlify.app/",
    credentials: true,
  })
);

app.use(express.json());

// Health check endpoint (Keep this for quick deployment verification)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Test AssemblyAI configuration
app.get('/api/test-assemblyai', async (req, res) => {
  try {
    const axios = require('axios');
    // NOTE: This function should also use dbConnect if it relies on a model 
    // or requires Mongoose to be initialized, but we will leave it simple for now.
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    
    if (!apiKey || apiKey === 'your_actual_assemblyai_api_key_here') {
      return res.status(500).json({ 
        success: false, 
        message: 'AssemblyAI API key is not configured.',
        configured: false
      });
    }
    
    // ... (rest of AssemblyAI logic)
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

// NOTE: Mongoose connection code is REMOVED from index.js and moved to dbConnect.js

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