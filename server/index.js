// server/index.js (MAXIMUM ISOLATION)

const express = require("express");
const http = require("http");

// NOTE: All other 'require' statements (dotenv, mongoose, socket.io, 
// cors, axios, routes, socketHandler) MUST be commented out 
// or temporarily removed from the file.

const app = express();
const server = http.createServer(app);

// Health check endpoint (This MUST work if Express is running)
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'isolated_ok', 
        message: 'Minimal server running'
    });
});

// Default 404 handler (Required if Vercel doesn't handle it)
app.use((req, res) => {
    res.status(404).send('404: Route Not Found (Isolated)');
});

// Export the server instance
module.exports = server;