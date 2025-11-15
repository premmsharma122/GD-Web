const Room = require('../models/Room');
const { nanoid } = require('nanoid');
const dbConnect = require('../dbConnect'); // <--- NEW: Import the connection helper

// Helper function to generate a unique passkey
const generatePasskey = () => nanoid(8); // Generates an 8-character key

// Create a new room
exports.createRoom = async (req, res) => {
    try {
        await dbConnect(); // <--- CALL DB CONNECT
        const passkey = generatePasskey();
        const newRoom = new Room({ passkey });
        await newRoom.save();
        res.status(201).json({ message: 'Room created successfully', passkey });
    } catch (err) {
        // Log error details for Vercel debugging
        console.error("Create Room Error:", err); 
        res.status(500).json({ message: 'Failed to create room', error: err.message });
    }
};

// Join an existing room
exports.joinRoom = async (req, res) => {
    const { passkey } = req.body;
    try {
        await dbConnect(); // <--- CALL DB CONNECT
        const room = await Room.findOne({ passkey });
        if (!room) {
            return res.status(404).json({ message: 'Room not found. Please check the passkey.' });
        }
        res.status(200).json({ message: 'Joined room successfully', room });
    } catch (err) {
        // Log error details for Vercel debugging
        console.error("Join Room Error:", err);
        res.status(500).json({ message: 'Failed to join room', error: err.message });
    }
};