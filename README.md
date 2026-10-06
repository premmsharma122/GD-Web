# 🎙️ GD-APP — AI-Powered Group Discussion & Placement Simulator

> Practice group discussions anytime. Speak, get transcribed live, and receive an AI-driven report on how you performed.

![Stack](https://img.shields.io/badge/MERN-Stack-green)
![Realtime](https://img.shields.io/badge/Realtime-Socket.io%20%2B%20WebRTC-blue)
![STT](https://img.shields.io/badge/STT-AssemblyAI-orange)
![Status](https://img.shields.io/badge/Status-Hackathon%20Build-purple)

**🔗 Live Demo:** `<add-link>` | **🎥 Demo Video:** `<add-link>` | **📊 Pitch Deck:** `<add-link>`

---

## 📌 Table of Contents
1. [The Problem](#-the-problem)
2. [Our Solution](#-our-solution)
3. [Key Features](#-key-features)
4. [How It Works](#-how-it-works)
5. [Benefits](#-benefits)
6. [Tech Stack](#-tech-stack)
7. [Architecture](#-architecture)
8. [Data Model](#-data-model)
9. [Socket Events & API](#-socket-events--api)
10. [Folder Structure](#-folder-structure)
11. [Getting Started](#-getting-started)
12. [Deployment](#-deployment)
13. [Challenges & Learnings](#-challenges--learnings)
14. [Roadmap](#-roadmap)
15. [Team](#-team)

---

## 🚨 The Problem
- Group discussions are a major placement filter, yet students rarely get realistic practice.
- Feedback is subjective, delayed, or missing; colleges lack the manpower to evaluate every student.
- Students cannot see their own patterns: how much they speak, how often they interrupt, how clear they are.

## 💡 Our Solution
GD-APP is a virtual placement-training companion. Users join a live room, speak through their microphone, and get a real-time transcript plus an automatic communication analysis with charts and targeted feedback.

---

## ✨ Key Features
- **Real-time group rooms** — join with a room code, see participants live
- **Microphone capture** — browser audio / WebRTC
- **Live speech-to-text** — powered by AssemblyAI
- **Automatic analysis report** — speaking time, participation rate, clarity
- **Contribution charts** — pie chart of who contributed how much
- **Personalised feedback** — targeted tips from your performance
- **Room dashboard** — session overview for hosts / institutions

---

## 🔄 How It Works

```text
1. Create or join a room  →  2. Speak via mic  →  3. Audio streamed for STT
→  4. Transcript + speaking stats per user  →  5. Analysis report + charts
→  6. Personalised feedback to improve next round
```

---

## 🌟 Benefits

| Audience | Value |
| --- | --- |
| **Students** | Practice anytime, instant feedback, accurate transcripts, clear improvement metrics |
| **Colleges / Institutions** | Run GD sessions online, automated analytics, no manual evaluation |
| **Developers** | Modular architecture, scalable backend, clean React frontend, easy deploy (Netlify + Render/Vercel) |

---

## 🧰 Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React.js (Vite), Socket.io-client, charting for contribution pie |
| **Backend** | Node.js, Express.js, Socket.io |
| **Database** | MongoDB (Mongoose) |
| **AI / STT** | AssemblyAI |
| **Media** | WebRTC / Browser Audio Capture |
| **Deploy** | Netlify (client), Render / Vercel (server) |

---

## 🏗 Architecture

```text
┌──────────────────────────┐
│  React Client (Vite)     │
│  JoinRoom · Room · Report│
│  Mic capture · Charts    │
└─────────┬────────────────┘
          │ Socket.io (events) + REST
          ▼
┌──────────────────────────┐        ┌──────────────┐
│ Express + Socket.io      │───────▶│ AssemblyAI   │
│ roomController           │  audio │ (STT)        │
│ roomSocket / analysis    │◀───────│ transcript   │
└─────────┬────────────────┘        └──────────────┘
          ▼
   ┌─────────────┐
   │ MongoDB     │  (Room: users, transcripts, stats)
   └─────────────┘
```

---

## 🗄 Data Model

```text
Room {
  roomId, createdAt,
  participants: [{ socketId, name, joinedAt }],
  transcripts:  [{ speaker, text, timestamp }],
  stats:        [{ speaker, speakingTime, wordCount, turns }]
}
```

> Adjust to match your `Room.js` schema.

---

## 📡 Socket Events & API
> Replace with the actual event names used in `roomSocket.js` and `socketHandler.js`.

| Type | Name | Purpose |
| --- | --- | --- |
| Socket | `join-room` | User enters a room |
| Socket | `user-list` | Broadcast updated participants |
| Socket | `transcript` | Push new transcribed text to the room |
| Socket | `leave-room` | Clean up on exit |
| REST | `POST /api/rooms` | Create a room |
| REST | `GET /api/rooms/:id` | Fetch room details |
| REST | `POST /api/analysis/:id` | Generate analysis report |

---

## 📁 Folder Structure

**Backend (`/server`)**
```text
server/
├── controllers/
│   └── roomController.js
├── models/
│   └── Room.js
├── routes/
│   ├── analysisRoutes.js
│   └── roomRoutes.js
├── services/
├── socket/
│   └── roomSocket.js
├── uploads/
├── utils/
│   └── dbConnect.js
├── socketHandler.js
├── index.js
├── package.json
└── .env
```

**Frontend (`/client`)**
```text
client/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── AnalysisReport.jsx
│   │   ├── ContributionPie.jsx
│   │   ├── Controls.jsx
│   │   ├── HomePage.jsx
│   │   ├── JoinRoom.jsx
│   │   ├── UserList.jsx
│   │   └── VideoTile.jsx
│   ├── pages/
│   │   ├── Room.jsx
│   │   └── RoomDashboard.jsx
│   ├── utils/
│   │   └── socket.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
└── .env
```

---

## 🚀 Getting Started

**Prerequisites:** Node.js v18+, MongoDB (Atlas or local), AssemblyAI API key.

### 1. Clone
```bash
git clone https://github.com/yourusername/GD-APP.git
cd GD-APP
```

### 2. Backend
```bash
cd server
npm install
```
Create `server/.env`:
```ini
MONGO_URI=your_mongo_url
ASSEMBLYAI_API_KEY=your_key
PORT=5000
```
```bash
npm start
```

### 3. Frontend
```bash
cd client
npm install
```
Create `client/.env`:
```ini
VITE_BACKEND_URL=http://localhost:5000
```
```bash
npm run dev
```

### Troubleshooting
| Problem | Fix |
| --- | --- |
| Mic not working | Browsers need HTTPS (or `localhost`) and microphone permission |
| No transcript | Verify `ASSEMBLYAI_API_KEY` and check server logs for API errors |
| Socket not connecting | Confirm `VITE_BACKEND_URL` and the CORS origin on the server |
| Mongo error | Whitelist your IP in Atlas / check `MONGO_URI` |
| Users can't hear each other | Test with two different browsers or devices; check STUN/TURN settings |

---

## ☁️ Deployment
- **Client:** Netlify. Set `VITE_BACKEND_URL` to the deployed server URL.
- **Server:** Render or Vercel. Set `MONGO_URI`, `ASSEMBLYAI_API_KEY`, `PORT`.
- **Note:** WebSockets need a host that supports persistent connections (Render does; Vercel serverless generally does not), so prefer Render for the Socket.io server.
- Allow the deployed client origin in the server's CORS and Socket.io config.

---

## 🔒 Privacy & Security Notes
- Audio and transcripts are personal data: show a consent notice before recording.
- Keep API keys server-side only; never expose `ASSEMBLYAI_API_KEY` to the client.
- Clear `uploads/` and set a retention period for transcripts.
- Add rate limiting on room creation and validate room IDs.

---

## 🧠 Challenges & Learnings
- **Real-time sync:** keeping participant lists and transcripts consistent across clients with Socket.io rooms.
- **Latency vs accuracy:** streaming STT gives live feedback; final transcripts are cleaner. Showing partial results then replacing them with finals gives the best experience.
- **Speaker attribution:** since each user speaks from their own mic, per-user streams make speaker labels reliable without diarization.
- **Fair metrics:** speaking time alone can reward talking over others, so combine it with turns, word count, and interruptions.

---

## 🗺 Roadmap
- [ ] Filler-word detection ("um", "like") and pace (words per minute)
- [ ] Sentiment and relevance scoring against the GD topic
- [ ] Random GD topic generator and timers
- [ ] AI moderator / AI participants for solo practice
- [ ] Interruption and turn-taking analytics
- [ ] Downloadable PDF report and progress history per user
- [ ] Authentication and institution dashboards
- [ ] Mock HR / technical interview mode
- [ ] Multilingual support

---

## 🌍 Impact
Objective, repeatable GD practice for every student, and zero-effort evaluation for institutions.

---

## 👥 Team

| Name | Role | Links |
| --- | --- | --- |
| Prem Sharma | Full-stack developer | [GitHub](https://github.com/premmsharma122) · [LinkedIn](https://www.linkedin.com/in/prem-sharma-0a4b62291/) |

---

## 📜 License
MIT. See `LICENSE`.

⭐ If you like this project, star the repo!
