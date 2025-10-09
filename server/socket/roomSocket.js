
const rooms = {}; // { roomId: { users: {}, ... } }

export const initRoomSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("join-room", ({ roomId, userName }) => {
            console.log(`User ${userName} joining room ${roomId}`);
            if (!rooms[roomId]) {
                rooms[roomId] = { users: {} };
            }

            // Notify everyone else in the room about the new user
            socket.to(roomId).emit("new-user-joined", {
                userId: socket.id,
                userName,
                socketId: socket.id,
            });

            // Add user to the room
            rooms[roomId].users[socket.id] = { id: socket.id, name: userName };
            socket.join(roomId);

            // Send current list of users to the new user and everyone else
            const currentUsers = Object.values(rooms[roomId].users);
            io.to(roomId).emit("room-data", currentUsers);
        });

        // WebRTC Signaling Events
        socket.on("offer", ({ to, offer }) => {
            socket.to(to).emit("offer", { from: socket.id, offer });
        });

        socket.on("answer", ({ to, answer }) => {
            socket.to(to).emit("answer", { from: socket.id, answer });
        });

        socket.on("ice-candidate", ({ to, candidate }) => {
            socket.to(to).emit("ice-candidate", { from: socket.id, candidate });
        });

        socket.on("leave-room", ({ roomId }) => {
            if (rooms[roomId] && rooms[roomId].users[socket.id]) {
                delete rooms[roomId].users[socket.id];
                io.to(roomId).emit("room-data", Object.values(rooms[roomId].users));
                io.to(roomId).emit("user-left", socket.id); // Notify others to clean up
            }
            socket.leave(roomId);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            for (const roomId in rooms) {
                if (rooms[roomId].users[socket.id]) {
                    delete rooms[roomId].users[socket.id];
                    
                    // Clean up empty rooms
                    if (Object.keys(rooms[roomId].users).length === 0) {
                        delete rooms[roomId];
                    } else {
                        io.to(roomId).emit("room-data", Object.values(rooms[roomId].users));
                        io.to(roomId).emit("user-left", socket.id); // Notify others
                    }
                    break;
                }
            }
        });
    });
};
