import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import JournalingComponent from './components/JournalingComponent';
import RoutineManagementApp from './components/RoutineManagementApp';
import EmpatheticChatbot from './components/EmpatheticChatbot';
import ProfileComponent from './components/ProfileComponent';
import ProfileSetup from './components/ProfileSetup';
import InteractiveStorytellingApp from './components/InteractiveStorytellingApp';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/journal" element={<JournalingComponent />} />
          <Route path="/routine" element={<RoutineManagementApp />} />
          <Route path="/chatbot" element={<EmpatheticChatbot />} />
          <Route path="/profile" element={<ProfileComponent />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/story" element={<InteractiveStorytellingApp />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;