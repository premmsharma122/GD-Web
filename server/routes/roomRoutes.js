const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// POST /api/rooms/create - Create a new room
router.post('/create', roomController.createRoom);

// POST /api/rooms/join - Join an existing room
router.post('/join', roomController.joinRoom);

module.exports = router;