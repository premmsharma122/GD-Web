
import { useState } from "react";

export default function Controls({ 
  onToggle, 
  onStartSpeak, 
  onStopSpeak, 
  onStartPrep, 
  onLeave, 
  usersCount 
}) {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  const handleMic = () => {
    setMicOn((prev) => {
      const newState = !prev;
      onToggle({ mic: newState });
      return newState;
    });
  };

  const handleVideo = () => {
    setVideoOn((prev) => {
      const newState = !prev;
      onToggle({ video: newState });
      return newState;
    });
  };

  const handleSpeak = () => {
    if (!speaking) {
      onStartSpeak();
      setSpeaking(true);
    } else {
      onStopSpeak();
      setSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Participants count */}
      <div className="text-sm text-gray-600 mb-2">
        <span className="font-semibold">{usersCount}</span> {usersCount === 1 ? 'participant' : 'participants'}
      </div>

      {/* Mic toggle */}
      <button
        onClick={handleMic}
        className={`p-3 rounded-lg font-medium transition ${
          micOn
            ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
            : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
        }`}
      >
        {micOn ? '🎤 Mic On' : '🔇 Mic Off'}
      </button>

      {/* Video toggle */}
      <button
        onClick={handleVideo}
        className={`p-3 rounded-lg font-medium transition ${
          videoOn
            ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
            : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
        }`}
      >
        {videoOn ? '📹 Camera On' : '📴 Camera Off'}
      </button>

      {/* Speaking toggle */}
      <button
        onClick={handleSpeak}
        className={`p-3 rounded-lg font-semibold transition ${
          speaking
            ? 'bg-blue-600 text-white hover:bg-blue-700 animate-pulse'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {speaking ? '🗣️ Stop Talking' : '💬 Start Talking'}
      </button>

      {/* Divider */}
      <div className="border-t border-gray-300 my-2"></div>

      {/* Start prep button */}
      <button
        onClick={onStartPrep}
        className="p-3 rounded-lg font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300 transition"
      >
        🎯 Start Random Topic
      </button>

      {/* Leave room button */}
      <button
        onClick={onLeave}
        className="p-3 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-300 transition"
      >
        🚪 Leave Room
      </button>
    </div>
  );
}
