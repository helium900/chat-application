import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Signup from "./pages/signup"; 
import FetchChat from "./pages/chatPage/fetchChat";
import SetUsername from "./pages/setUsername";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/chat" element={<FetchChat />} />
      <Route path="/setUsername" element={<SetUsername />} />
    </Routes>
  );
}

export default App;
