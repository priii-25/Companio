//Companio\client\src\components\AuthPage.jsx
import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';

const AuthPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('login');

  const switchToLogin = () => setCurrentView('login');
  const switchToSignup = () => setCurrentView('signup');

  // If user is authenticated, show dashboard or redirect
  if (isAuthenticated) {
    return (
      <div className="success-container">
        <div className="success-card">
          <h1>Welcome!</h1>
          <p>You have successfully logged in.</p>
          {/* In a real app, you would redirect to the dashboard or main app here */}
        </div>
      </div>
    );
  }

  return (
    <>
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
    </>
  );
};

export default AuthPage;