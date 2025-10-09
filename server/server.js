require('dotenv').config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const roomRoutes = require("./routes/roomRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const socketHandler = require("./socketHandler");

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
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
app.get('/api/test-assemblyai', async (req, res) => {
  try {
    const axios = require('axios');
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    
    if (!apiKey || apiKey === 'your_actual_assemblyai_api_key_here') {
      return res.status(500).json({ 
        success: false, 
        message: 'AssemblyAI API key is not configured. Please check your .env file.',
        configured: false
      });
    }
    
    // Test the API key by making a simple request
    const response = await axios.get('https://api.assemblyai.com/v2/transcript', {
      headers: { authorization: apiKey },
      params: { limit: 1 }
    });
    
    res.json({ 
      success: true, 
      message: 'AssemblyAI API key is valid and working!',
      configured: true
    });
  } catch (error) {
    console.error('AssemblyAI test failed:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'AssemblyAI API key test failed',
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      configured: true,
      hint: error.response?.status === 401 
        ? 'API key is invalid. Please check your AssemblyAI dashboard.' 
        : 'Unknown error. Check server logs.'
    });
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

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Test AssemblyAI: http://localhost:${PORT}/api/test-assemblyai`);
  
  // Check API key on startup
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey || apiKey === 'your_actual_assemblyai_api_key_here') {
    console.warn('⚠️  WARNING: AssemblyAI API key is not configured!');
    console.warn('Please set ASSEMBLYAI_API_KEY in your .env file');
    console.warn('Current value:', apiKey || 'undefined');
  } else {
    console.log('✅ AssemblyAI API key is configured');
    console.log('Key starts with:', apiKey.substring(0, 8) + '...');
  }
});