require('dotenv').config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

// **********************************************
// MODULE IMPORTS COMMENTED OUT FOR TESTING
// **********************************************
// const roomRoutes = require("./routes/roomRoutes");
// const analysisRoutes = require("./routes/analysisRoutes");
// const socketHandler = require("./socketHandler");
// **********************************************

const app = express();
const server = http.createServer(app);

// CORS configuration (Ensure you update CLIENT_ORIGIN in Vercel settings)
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "https://wonderful-dasik-d7b0f9.netlify.app/",
    credentials: true,
  })
);

app.use(express.json());

// Health check endpoint (KEEP THIS ACTIVE!)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Test AssemblyAI configuration (COMMENT OUT - it uses 'axios' which is a dependency that could cause issues)
/*
app.get('/api/test-assemblyai', async (req, res) => {
  try {
    const axios = require('axios');
    // ... (rest of the AssemblyAI logic)
  } catch (error) {
    // ...
  }
});
*/

// API routes (USAGE COMMENTED OUT)
// app.use("/api/rooms", roomRoutes);
// app.use("/api/analysis", analysisRoutes);

// Error handling middleware (KEEP THIS)
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: err.message 
  });
});

// MongoDB connection (ALREADY COMMENTED OUT - GOOD)
// // mongoose.connect(...)

// Initialize Socket.IO (COMMENT OUT - use of 'io' and 'Server' object might be causing crash)
/*
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
*/

// Initialize socket handlers (USAGE COMMENTED OUT)
// socketHandler(io);


// -------------------------------------------------------------
// VERCEL EXPORT (KEEP THIS ACTIVE!)
// -------------------------------------------------------------
module.exports = server;
