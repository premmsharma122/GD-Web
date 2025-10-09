
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const HomePage = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    if (!userName.trim()) {
      setMessage('Please enter your name before creating a room.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:5000/api/rooms/create');
      const { passkey } = response.data;

      // Navigate to the room dashboard
      navigate(`/room/${passkey}`, { state: { name: userName.trim() } });
    } catch (error) {
      console.error('Error creating room:', error);
      setMessage('Error creating room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && userName.trim() && !loading) {
      handleCreateRoom();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
          Welcome to Discussion Room
        </h1>

        <div className="space-y-4">
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
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={loading || !userName.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Room...' : 'Create a Room'}
          </button>

          <div className="text-center">
            <span className="text-gray-600">or</span>
          </div>

          <button
            onClick={() => navigate('/join')}
            className="w-full bg-white text-blue-600 py-3 px-4 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition duration-300"
            disabled={loading}
          >
            Join a Room
          </button>
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-center ${
              message.includes('Error')
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

export default HomePage;