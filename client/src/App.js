//Companio\client\src\App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import MemoryRecall from './components/MemoryRecall';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/memory" element={<MemoryRecall />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
