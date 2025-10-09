
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import JoinRoom from "./components/JoinRoom";
import RoomDashboard from "./pages/RoomDashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/room/:id" element={<RoomDashboard />} />
      </Routes>
    </Router>
  );
}