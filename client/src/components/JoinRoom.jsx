import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Define the Vercel Backend URL here
// Use the deployed domain for the API calls
const BACKEND_BASE_URL = 'https://gd-web-rose.vercel.app'; 

const JoinRoom = () => {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!roomId.trim()) {
      setMessage('Please enter a room passkey.');
      return;
    }

    if (!userName.trim()) {
      setMessage('Please enter your name.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Verify room exists
      // --- FIX APPLIED HERE ---
      const response = await axios.post(`${BACKEND_BASE_URL}/api/rooms/join`, {
        passkey: roomId.trim(),
      });
      // --------------------------

      if (response.data.room) {
        // Navigate to room dashboard
        navigate(`/room/${roomId.trim()}`, { state: { name: userName.trim() } });
      }
    } catch (error) {
      console.error('Error joining room:', error);
      if (error.response?.status === 404) {
        setMessage('Room not found. Please check the passkey.');
      } else {
        setMessage('Error joining room. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleJoin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
          Join a Room
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Passkey
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter room passkey"
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your name"
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={loading || !roomId.trim() || !userName.trim()}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>

          <div className="text-center">
            <button
              onClick={() => navigate('/')}
              className="text-purple-600 hover:underline"
              disabled={loading}
            >
              ← Back to Home
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-center ${
              message.includes('Error') || message.includes('not found')
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinRoom;