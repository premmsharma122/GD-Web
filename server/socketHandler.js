const { v4: uuidv4 } = require("uuid");

module.exports = function socketHandler(io) {
  const rooms = new Map();

  function ensureRoom(roomId) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { users: {}, prepTimeout: null, discussionActive: false });
    }
    return rooms.get(roomId);
  }

  function computeContributions(room) {
    const users = Object.values(room.users);
    const total = users.reduce((s, u) => s + (u.speakingTime || 0), 0) || 1;

    return users.map((u) => ({
      name: u.name,
      socketId: u.socketId,
      speakingTime: u.speakingTime || 0,
      percent: Math.round(((u.speakingTime || 0) / total) * 100),
    }));
  }

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    socket.on("join-room", ({ roomId, name }) => {
      if (!roomId || !name) {
        socket.emit("error", { message: "Room ID and name are required" });
        return;
      }

      socket.join(roomId);
      const room = ensureRoom(roomId);

      const user = {
        socketId: socket.id,
        userId: uuidv4(),
        name: name.trim() || "Anonymous",
        mic: true,
        video: true,
        speaking: false,
        speakingStart: null,
        speakingTime: 0,
      };

      room.users[socket.id] = user;

      // Notify all users
      io.to(roomId).emit("room-data", Object.values(room.users));
      io.to(roomId).emit("contribution-update", computeContributions(room));
      
      // Notify others about new user for WebRTC
      socket.to(roomId).emit("new-user-joined", {
        userId: user.userId,
        userName: user.name,
        socketId: socket.id
      });
      
      socket.emit("room-joined", { roomId, user });

      console.log(`👤 ${user.name} joined room ${roomId}`);
    });

    // WebRTC Signaling
    socket.on("offer", ({ to, offer }) => {
      socket.to(to).emit("offer", { from: socket.id, offer });
    });

    socket.on("answer", ({ to, answer }) => {
      socket.to(to).emit("answer", { from: socket.id, answer });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      socket.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    socket.on("toggle-media", ({ roomId, mic, video }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users[socket.id];
      if (!user) return;

      if (typeof mic === "boolean") user.mic = mic;
      if (typeof video === "boolean") user.video = video;

      io.to(roomId).emit("room-data", Object.values(room.users));
    });

    socket.on("start-speaking", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users[socket.id];
      if (!user || user.speaking) return;

      user.speaking = true;
      user.speakingStart = Date.now();

      io.to(roomId).emit("room-data", Object.values(room.users));
    });

    socket.on("stop-speaking", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users[socket.id];
      if (!user || !user.speaking) return;

      const delta = Date.now() - (user.speakingStart || Date.now());
      user.speakingTime = (user.speakingTime || 0) + delta;
      user.speaking = false;
      user.speakingStart = null;

      io.to(roomId).emit("room-data", Object.values(room.users));
      io.to(roomId).emit("contribution-update", computeContributions(room));
    });

    socket.on("start-prep", ({ roomId, starter }) => {
      const room = ensureRoom(roomId);
      
      if (room.prepTimeout) {
        socket.emit("error", { message: "Preparation already in progress" });
        return;
      }

      const topics = [
        "Impact of remote learning on education",
        "AI in modern education systems",
        "Climate change and sustainable solutions",
        "The future of work and automation",
        "Social media's impact on mental health",
        "Importance of soft skills in careers",
        "Ethics of artificial intelligence",
        "Digital privacy in the modern age",
      ];

      const topic = topics[Math.floor(Math.random() * topics.length)];
      const prepDuration = 40;

      io.to(roomId).emit("prep-start", { topic, prepDuration, starter });

      room.prepTimeout = setTimeout(() => {
        room.prepTimeout = null;
        room.discussionActive = true;
        io.to(roomId).emit("discussion-start", { topic });
      }, prepDuration * 1000);
    });

    socket.on("end-discussion", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      if (room.prepTimeout) {
        clearTimeout(room.prepTimeout);
        room.prepTimeout = null;
      }

      room.discussionActive = false;

      Object.values(room.users).forEach((u) => {
        if (u.speaking) {
          const delta = Date.now() - (u.speakingStart || Date.now());
          u.speakingTime = (u.speakingTime || 0) + delta;
        }
        u.speaking = false;
        u.speakingStart = null;
      });

      io.to(roomId).emit("discussion-ended");
      io.to(roomId).emit("room-data", Object.values(room.users));
      io.to(roomId).emit("contribution-update", computeContributions(room));
    });

    socket.on("leave-room", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users[socket.id];
      if (user) {
        if (user.speaking) {
          const delta = Date.now() - (user.speakingStart || Date.now());
          user.speakingTime = (user.speakingTime || 0) + delta;
        }

        delete room.users[socket.id];
        socket.leave(roomId);

        // Notify others that user left
        io.to(roomId).emit("user-left", socket.id);
        io.to(roomId).emit("room-data", Object.values(room.users));
        io.to(roomId).emit("contribution-update", computeContributions(room));

        if (Object.keys(room.users).length === 0) {
          if (room.prepTimeout) clearTimeout(room.prepTimeout);
          rooms.delete(roomId);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);

      for (const [roomId, room] of rooms) {
        if (room.users[socket.id]) {
          const user = room.users[socket.id];

          if (user.speaking) {
            const delta = Date.now() - (user.speakingStart || Date.now());
            user.speakingTime = (user.speakingTime || 0) + delta;
          }

          delete room.users[socket.id];

          io.to(roomId).emit("user-left", socket.id);
          io.to(roomId).emit("room-data", Object.values(room.users));
          io.to(roomId).emit("contribution-update", computeContributions(room));

          if (Object.keys(room.users).length === 0) {
            if (room.prepTimeout) clearTimeout(room.prepTimeout);
            rooms.delete(roomId);
          }
        }
      }
    });
  });
};