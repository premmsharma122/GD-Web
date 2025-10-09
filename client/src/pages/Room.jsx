
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import socket from '../utils/socket';
import UserList from '../components/UserList';

const Room = () => {
    const { roomId } = useParams();
    const location = useLocation();
    const userName = location.state?.userName || 'Guest';

    const [users, setUsers] = useState([]);
    const [stream, setStream] = useState(null); // State to hold the local media stream
    const localVideoRef = React.createRef();

    useEffect(() => {
        // Function to get the user's media stream and join the room
        const setupRoom = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                setStream(mediaStream); // Store the stream in state
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = mediaStream;
                }

                // After getting the stream, emit the join-room event
                socket.emit('join-room', { roomId, userName });

            } catch (error) {
                console.error("Error accessing media devices.", error);
            }
        };

        // Listen for user updates from the server
        const handleRoomUsers = (users) => {
            setUsers(users);
        };
        
        socket.on('room-users', handleRoomUsers);

        // Start the setup process
        setupRoom();

        // Cleanup function
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            socket.emit('leave-room', { roomId });
            socket.off('room-users', handleRoomUsers);
        };

    }, [roomId, userName, localVideoRef, stream]);

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            <header className="p-4 bg-gray-800 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Discussion Room</h1>
                <div className="flex items-center space-x-4">
                    <span className="text-lg">Room Key: <span className="font-mono bg-gray-700 px-2 py-1 rounded">{roomId}</span></span>
                    <span className="text-lg">Welcome, <span className="font-semibold text-blue-400">{userName}</span></span>
                </div>
            </header>
            
            <main className="flex flex-1 p-4 overflow-hidden">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 overflow-y-auto">
                    {/* Local User Video */}
                    <div className="relative w-full aspect-video bg-gray-700 rounded-lg overflow-hidden">
                        <video 
                            ref={localVideoRef} 
                            autoPlay 
                            muted 
                            playsInline 
                            className="w-full h-full object-cover" 
                        />
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-sm">You</div>
                    </div>
                    {/* Other User Videos will go here, mapped from the 'users' state */}
                    {users.map(user => (
                        <div key={user.id} className="relative w-full aspect-video bg-gray-700 rounded-lg overflow-hidden">
                            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-sm">{user.name}</div>
                        </div>
                    ))}
                </div>

                <div className="w-1/4 p-4 bg-gray-800 rounded-lg ml-4">
                    <UserList users={users} />
                </div>
            </main>
        </div>
    );
};

export default Room;