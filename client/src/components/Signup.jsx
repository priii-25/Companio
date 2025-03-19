import React, { useState } from 'react';
import axios from 'axios';
import './AuthStyles.css';

const Signup = ({ setIsAuthenticated, switchToLogin }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // ✅ New state for success message
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(''); // ✅ Clear previous success message

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/users/register', {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
      });

      localStorage.setItem('token', response.data.token);
      setIsAuthenticated(true);
      setSuccess('🎉 Registration successful! Redirecting...'); // ✅ Show success message
      setLoading(false);

      // ✅ Redirect to login after 2 seconds
      setTimeout(() => switchToLogin(), 2000);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p className="auth-subtitle">Please complete the form below</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>} {/* ✅ Show success message */}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-alt-option">
          <p>Already have an account?</p>
          <button className="text-button" onClick={switchToLogin}>Sign In</button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
