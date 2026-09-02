#  GD-APP: AI-Powered Group Discussion & Placement Simulator 
A full-stack, real-time web application designed to simulate placement interviews, group discussions (GD), and feedback sessions using AI-driven speech analysis.
GD-APP helps students improve communication, participation, and clarity through live transcription, automated analytics, and personalized insights.
##  🚀 Overview
-  GD-APP enables users to:
-  Join real-time group discussions 
-  Speak using microphone (WebRTC / Browser Audio Capture)
-  Get live speech-to-text (STT) using AssemblyAI 
-  Receive an automatic communication analysis report
-  View charts for contribution and speaking patterns
-  Improve through targeted feedback based on performance
-  It acts as a virtual placement-training companion.
##  🎯 Goals
-  Provide objective, AI-driven feedback for GD preparation
-  Measure speaking time, participation rate, and clarity
-  Enable students to practice confidently before placements
-  Allow institutions to conduct GD simulation sessions online
##  🌟 Benefits 
**✔ For Students**
Real GD practice anytime
Instant feedback
Accurate STT transcripts
Clear improvement metrics

**✔ For Colleges/Institutions**
Conduct GD sessions online
Automated analytics
No manual evaluation needed

**✔ For Developers**
Modular architecture
Scalable backend
Clean React frontend
Easy to deploy (Netlify + Render/Vercel)

##  🏗 Tech Stack
**Backend (/server)**
```html
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
├── .env

```
**Frontend (/client)**
```html
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
├── .env
```
##  ⚙ Setup Instructions (Local Development)
**Follow these steps to run the project locally.**
###  1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/GD-APP.git
cd GD-APP
```
###  2️⃣ Backend Setup
```bash
cd server
npm install
```
**Create .env**
```ini
MONGO_URI=your_mongo_url
ASSEMBLYAI_API_KEY=your_key
PORT=5000

```
**Start Backend**
```powershell
npm start
```
###  3️⃣ Frontend Setup
```bash
cd client
npm install
```
**Create .env**
```ini
VITE_BACKEND_URL=http://localhost:5000
```
**Start Frontend**
```arduino
npm run dev
```
