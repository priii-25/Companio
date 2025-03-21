import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import './AuthStyles.css';

const AuthPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('login');

  const switchToLogin = () => setCurrentView('login');
  const switchToSignup = () => setCurrentView('signup');

  if (isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="vintage-background"></div>
        <div className="floating-shapes"></div>
        <div className="success-container">
          <div className="success-card">
            <h1>Welcome!</h1>
            <p>You have successfully logged in.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="vintage-background"></div>
      <div className="floating-shapes"></div>
      {currentView === 'login' ? (
        <Login 
          setIsAuthenticated={setIsAuthenticated} 
          switchToSignup={switchToSignup} 
        />
      ) : (
        <Signup 
          setIsAuthenticated={setIsAuthenticated} 
          switchToLogin={switchToLogin} 
        />
      )}
    </div>
  );
};

export default AuthPage;