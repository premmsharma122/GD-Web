import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import socket from "../utils/socket";
import UserList from "../components/UserList";
import Controls from "../components/Controls";
import ContributionPie from "../components/ContributionPie";
import AnalysisReport from "../components/AnalysisReport";

export default function RoomDashboard() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const initialName = location.state?.name || "";
  const [name, setName] = useState(initialName);
  const [users, setUsers] = useState([]);
  const [contrib, setContrib] = useState([]);
  const [prep, setPrep] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [userSpeakingTime, setUserSpeakingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  
  const localVideoRef = useRef(null);
  const hasJoined = useRef(false);
  const peersRef = useRef({});
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Get user media on mount
  useEffect(() => {
    const getUserMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setError("Could not access camera/microphone. Please grant permissions.");
      }
    };

    getUserMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      stopRecording();
    };
  }, []);

  // Start recording audio
  const startRecording = () => {
    if (!localStream) return;

    try {
      // Create a new media recorder with audio only
      const audioStream = new MediaStream(localStream.getAudioTracks());
      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        console.log('Recording stopped, blob size:', audioBlob.size);
      };

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording');
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('Recording stopped');
    }
  };

  useEffect(() => {
    if (!name.trim() || !localStream) return;

    socket.connect();

    const handleConnect = () => {
      console.log("Connected to server");
      setConnected(true);
      
      if (!hasJoined.current) {
        socket.emit("join-room", { roomId: id, name: name.trim() });
        hasJoined.current = true;
      }
    };

    const handleRoomJoined = ({ roomId }) => {
      console.log("Successfully joined room:", roomId);
    };

    const handleRoomData = (roomUsers) => {
      setUsers(roomUsers);
      
      const currentUser = roomUsers.find(u => u.name === name);
      if (currentUser) {
        setUserSpeakingTime(currentUser.speakingTime || 0);
      }
      
      roomUsers.forEach(user => {
        if (user.socketId !== socket.id && !peersRef.current[user.socketId]) {
          createPeerConnection(user.socketId);
        }
      });
    };

    const handleNewUserJoined = ({ userId, userName, socketId }) => {
      console.log("New user joined:", userName);
      createPeerConnection(socketId, true);
    };

    const handleUserLeft = (socketId) => {
      console.log("User left:", socketId);
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams[socketId];
        return newStreams;
      });
    };

    const handleOffer = async ({ from, offer }) => {
      const pc = peersRef.current[from] || createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer });
    };

    const handleAnswer = async ({ from, answer }) => {
      const pc = peersRef.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIceCandidate = ({ from, candidate }) => {
      const pc = peersRef.current[from];
      if (pc) {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleContributionUpdate = (data) => {
      setContrib(data);
    };

    const handlePrepStart = ({ topic, prepDuration }) => {
      setPrep({ topic, remaining: prepDuration, startedAt: Date.now() });
      // Start recording when discussion prep starts
      startRecording();
    };

    const handleDiscussionStart = ({ topic }) => {
      setPrep(null);
      alert(`Discussion started: ${topic}`);
    };

    const handleDiscussionEnded = () => {
      setPrep(null);
      // Stop recording when discussion ends
      stopRecording();
      alert("Discussion ended. Check the contribution chart!");
    };

    const handleError = ({ message }) => {
      setError(message);
      setTimeout(() => setError(""), 3000);
    };

    const handleDisconnect = () => {
      console.log("Disconnected from server");
      setConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("room-joined", handleRoomJoined);
    socket.on("room-data", handleRoomData);
    socket.on("new-user-joined", handleNewUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("contribution-update", handleContributionUpdate);
    socket.on("prep-start", handlePrepStart);
    socket.on("discussion-start", handleDiscussionStart);
    socket.on("discussion-ended", handleDiscussionEnded);
    socket.on("error", handleError);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.emit("leave-room", { roomId: id });
      socket.off("connect", handleConnect);
      socket.off("room-joined", handleRoomJoined);
      socket.off("room-data", handleRoomData);
      socket.off("new-user-joined", handleNewUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("contribution-update", handleContributionUpdate);
      socket.off("prep-start", handlePrepStart);
      socket.off("discussion-start", handleDiscussionStart);
      socket.off("discussion-ended", handleDiscussionEnded);
      socket.off("error", handleError);
      socket.off("disconnect", handleDisconnect);
      
      Object.values(peersRef.current).forEach(pc => pc.close());
      
      socket.disconnect();
      hasJoined.current = false;
    };
  }, [id, name, localStream]);

  const createPeerConnection = (socketId, initiator = false) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });

    peersRef.current[socketId] = pc;

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [socketId]: event.streams[0]
      }));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { to: socketId, candidate: event.candidate });
      }
    };

    if (initiator) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          socket.emit("offer", { to: socketId, offer: pc.localDescription });
        });
    }

    return pc;
  };

  useEffect(() => {
    if (!prep) return;
    
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - prep.startedAt) / 1000);
      const remaining = Math.max(0, prep.remaining - elapsed);
      
      setPrep((p) => (p ? { ...p, remaining } : p));
      
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 250);

    return () => clearInterval(timer);
  }, [prep]);

  if (!name.trim()) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-96">
          <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
            Enter Your Name
          </h2>
          <p className="text-gray-600 mb-4 text-center">
            Room: <span className="font-mono font-semibold">{id}</span>
          </p>
          <input
            className="border border-gray-300 rounded w-full p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && name.trim()) {
                setName(name.trim());
              }
            }}
            autoFocus
          />
          <button
            onClick={() => {
              if (name.trim()) {
                setName(name.trim());
              } else {
                alert("Please enter a name");
              }
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded w-full font-semibold hover:bg-blue-700 transition"
          >
            Join Room
          </button>
          <button
            onClick={() => navigate("/")}
            className="mt-2 text-gray-600 hover:underline w-full text-center"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const toggleMedia = (payload) => {
    if (connected && localStream) {
      if (payload.mic !== undefined) {
        localStream.getAudioTracks().forEach(track => {
          track.enabled = payload.mic;
        });
      }
      if (payload.video !== undefined) {
        localStream.getVideoTracks().forEach(track => {
          track.enabled = payload.video;
        });
      }
      socket.emit("toggle-media", { roomId: id, ...payload });
    }
  };

  const startSpeak = () => {
    if (connected) {
      socket.emit("start-speaking", { roomId: id });
    }
  };

  const stopSpeak = () => {
    if (connected) {
      socket.emit("stop-speaking", { roomId: id });
    }
  };

  const startPrep = () => {
    if (connected) {
      socket.emit("start-prep", { roomId: id, starter: name });
    }
  };

  const endDiscussion = () => {
    if (connected && confirm("Are you sure you want to end the discussion?")) {
      socket.emit("end-discussion", { roomId: id });
      stopRecording();
    }
  };

  const leaveRoom = () => {
    if (confirm("Are you sure you want to leave the room?")) {
      stopRecording();
      socket.emit("leave-room", { roomId: id });
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Discussion Room</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              Room: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{id}</span>
            </div>
            <div className="text-sm">
              Welcome, <span className="font-semibold text-blue-600">{name}</span>
            </div>
            {isRecording && (
              <div className="flex items-center gap-2 bg-red-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-red-700 font-medium">Recording</span>
              </div>
            )}
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} 
                 title={connected ? 'Connected' : 'Disconnected'} />
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto mt-4 px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-3">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-3">
                Participants ({users.length})
              </h3>
              <UserList users={users} />
            </div>
          </aside>

          <main className="col-span-6">
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h3 className="font-bold text-lg mb-3">Video Streams</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                    You ({name})
                  </div>
                </div>

                {Object.entries(remoteStreams).map(([socketId, stream]) => {
                  const user = users.find(u => u.socketId === socketId);
                  return (
                    <RemoteVideo
                      key={socketId}
                      stream={stream}
                      name={user?.name || 'Unknown'}
                    />
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Discussion Area</h2>

              {prep ? (
                <div className="p-6 rounded-lg bg-yellow-50 border-2 border-yellow-300">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    🎯 Preparation Time
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Topic: <strong>{prep.topic}</strong>
                  </p>
                  <div className="flex items-center justify-center">
                    <div className="text-4xl font-bold text-yellow-600">
                      {prep.remaining}s
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3 text-center">
                    Get ready! Discussion will start automatically.
                  </p>
                </div>
              ) : (
                <div className="text-center p-6 text-gray-500">
                  <p>No active discussion.</p>
                  <p className="text-sm mt-2">Click "Start Random Topic" to begin!</p>
                </div>
              )}

              <div className="mt-6">
                <ContributionPie 
                  data={contrib.length ? contrib : users.map(u => ({ 
                    name: u.name, 
                    speakingTime: u.speakingTime || 0 
                  }))} 
                />
              </div>

              <div className="mt-4 flex gap-3">
                {prep && (
                  <button
                    onClick={endDiscussion}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition"
                  >
                    End Discussion
                  </button>
                )}
                <button
                  onClick={() => setShowAnalysis(true)}
                  disabled={!recordedAudio}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition flex items-center justify-center disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
                  title={!recordedAudio ? 'Please record a discussion first' : 'Generate analysis report'}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Get Analysis Report
                </button>
              </div>
              
              {!recordedAudio && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Start a discussion to enable analysis
                </p>
              )}
            </div>
          </main>

          <aside className="col-span-3">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-3">Controls</h3>
              <Controls
                onToggle={toggleMedia}
                onStartSpeak={startSpeak}
                onStopSpeak={stopSpeak}
                onStartPrep={startPrep}
                onLeave={leaveRoom}
                usersCount={users.length}
              />
            </div>
          </aside>
        </div>
      </div>

      {showAnalysis && (
        <AnalysisReport
          roomId={id}
          userName={name}
          speakingTime={userSpeakingTime}
          audioBlob={recordedAudio}
          onClose={() => setShowAnalysis(false)}
        />
      )}
    </div>
  );
}

function RemoteVideo({ stream, name }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
        {name}
      </div>
    </div>
  );
}