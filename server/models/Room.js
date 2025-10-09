const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
    passkey: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Room = mongoose.model('Room', roomSchema);
module.exports = Room;