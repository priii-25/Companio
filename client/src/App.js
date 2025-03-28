import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthPage from './components/AuthPage';
import JournalingComponent from './components/JournalingComponent';
import RoutineManagementApp from './components/RoutineManagementApp';
import EmpatheticChatbot from './components/EmpatheticChatbot';
import ProfileComponent from './components/ProfileComponent';
import InteractiveStorytellingApp from './components/InteractiveStorytellingApp';
import Signup from './components/Signup';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        await axios.get('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Token validation failed:', err);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    };

    validateToken();
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    navigate('/journal');
  };

  const PrivateRoute = ({ element }) => {
    if (isAuthenticated === null) {
      return <div>Loading...</div>;
    }
    return isAuthenticated ? element : <Navigate to="/login" />;
  };

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<AuthPage onLogin={handleLogin} />} />
        <Route
          path="/register"
          element={<Signup switchToLogin={() => navigate('/login')} />}
        />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/journal" element={<PrivateRoute element={<JournalingComponent />} />} />
        <Route path="/routine" element={<PrivateRoute element={<RoutineManagementApp />} />} />
        <Route path="/chatbot" element={<PrivateRoute element={<EmpatheticChatbot />} />} />
        <Route path="/profile" element={<PrivateRoute element={<ProfileComponent />} />} />
        <Route path="/story" element={<PrivateRoute element={<InteractiveStorytellingApp />} />} />
      </Routes>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}