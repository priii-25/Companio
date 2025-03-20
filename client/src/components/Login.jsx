// Companio\client\src\components\Login.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AuthStyles.css';

// Collection of comforting quotes for elderly users with dementia
const comfortingQuotes = [
  "Today is a beautiful day to remember what matters most.",
  "You are surrounded by people who care about you.",
  "Small moments make the biggest memories.",
  "Take each day one step at a time, you're doing wonderfully.",
  "Your story is still being written, and it's a beautiful one.",
  "A garden of memories grows in the heart, even when the mind forgets.",
  "In this moment, you are exactly where you need to be.",
  "The greatest joy comes from connecting with those we love.",
  "Today's sunshine is a reminder of life's simple pleasures.",
  "Your presence brings warmth and joy to everyone around you."
];

// Animated icons for form fields (SVG paths)
const icons = {
  email: "M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z",
  password: "M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15 8H9V6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8Z",
  user: "M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
};

const AnimatedIcon = ({ path }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="form-icon">
    <path d={path} fill="currentColor" />
  </svg>
);

const Login = ({ setIsAuthenticated, switchToSignup }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Set a random quote when component mounts
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * comfortingQuotes.length);
    setQuote(comfortingQuotes[randomIndex]);
    
    // Rotate quotes every 12 seconds
    const quoteInterval = setInterval(() => {
      const newIndex = Math.floor(Math.random() * comfortingQuotes.length);
      setQuote(comfortingQuotes[newIndex]);
    }, 12000);
    
    return () => clearInterval(quoteInterval);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/users/login', formData);
      localStorage.setItem('token', response.data.token);
      
      // Add visual feedback before authentication is complete
      document.querySelector('.auth-card').classList.add('success-animation');
      
      setTimeout(() => {
        setIsAuthenticated(true);
        setLoading(false);
      }, 1000);
      
    } catch (err) {
      setLoading(false);
      setError('Login failed. Please check your email and password.');
      console.error('Login error:', err.response?.data || err.message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-container">
      <div className="floating-shapes"></div>
      
      <div className="auth-card">
        <div className="card-decoration"></div>
        
        <h1 className="welcome-title">Welcome Back</h1>
        <p className="auth-subtitle">We're so happy to see you again</p>
        
        <div className="quote-container">
          <p className="inspirational-quote">{quote}</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className={`form-group ${focusedField === 'email' ? 'focused' : ''}`}>
            <label htmlFor="email">
              <AnimatedIcon path={icons.email} /> Email Address
            </label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
              />
              <div className="input-focus-effect"></div>
            </div>
          </div>
          
          <div className={`form-group ${focusedField === 'password' ? 'focused' : ''}`}>
            <label htmlFor="password">
              <AnimatedIcon path={icons.password} /> Password
            </label>
            <div className="input-wrapper password-input">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
              <div className="input-focus-effect"></div>
            </div>
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            <span className="button-text">{loading ? 'Signing In...' : 'Sign In'}</span>
            <span className="button-shine"></span>
          </button>
        </form>
        
        <div className="auth-alt-option">
          <p>Don't have an account?</p>
          <button className="text-button" onClick={switchToSignup}>
            Create Account
          </button>
        </div>

        <div className="helper-text">
          <p>Need assistance? Your caregiver can help you sign in.</p>
        </div>
      </div>
    </div>
  );
};
export default Login;