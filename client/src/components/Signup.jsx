import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AuthStyles.css'; // Reuse AuthStyles.css
import '../styles/ProfileSetup.css'; // Include ProfileSetup styles

const comfortingQuotes = [
  "Today is a beautiful day to remember what matters most.",
  "You are surrounded by people who care about you.",
  "Small moments make the biggest memories.",
  "Take each day one step at a time, you're doing wonderfully.",
  "Your story is still being written, and it’s a beautiful one.",
];

const icons = {
  email: "M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z",
  password: "M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15 8H9V6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8Z",
  user: "M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z",
};

const AnimatedIcon = ({ path }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="form-icon">
    <path d={path} fill="currentColor" />
  </svg>
);

const Signup = ({ switchToLogin }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    preferredName: '',
    dateOfBirth: '',
    location: '',
    medicalHistory: [{ condition: '', notes: '' }],
    medications: [{ name: '', dosage: '', schedule: '' }],
    allergies: [''],
    caregiverContacts: [{ name: '', phone: '', email: '' }],
    accessibility: { fontSize: 'Large', colorScheme: 'Soothing Pastels', voiceActivation: true },
    medicalReports: [],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * comfortingQuotes.length);
    setQuote(comfortingQuotes[randomIndex]);
    const quoteInterval = setInterval(() => {
      const newIndex = Math.floor(Math.random() * comfortingQuotes.length);
      setQuote(comfortingQuotes[newIndex]);
    }, 12000);
    return () => clearInterval(quoteInterval);
  }, []);

  const handleChange = (e, section, index) => {
    const { name, value } = e.target;
    if (section === 'simple') {
      setFormData({ ...formData, [name]: value });
    } else if (section === 'array') {
      const updatedArray = [...(formData[name] || [])];
      updatedArray[index] = value || '';
      setFormData({ ...formData, [name]: updatedArray });
    } else if (section === 'objectArray') {
      const field = e.target.dataset.field;
      const updatedArray = [...(formData[name] || [])];
      updatedArray[index] = { ...(updatedArray[index] || {}), [field]: value || '' };
      setFormData({ ...formData, [name]: updatedArray });
    } else if (section === 'accessibility') {
      setFormData({
        ...formData,
        accessibility: { ...formData.accessibility, [name]: value },
      });
    }
  };

  const handleCheckboxChange = (e) => {
    setFormData({
      ...formData,
      accessibility: { ...formData.accessibility, voiceActivation: e.target.checked },
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({ ...formData, medicalReports: files });
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
  
    if (step === 1) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      handleNext();
      return;
    }
  
    if (step < 4) {
      handleNext();
      return;
    }
  
    setLoading(true);
  
    const cleanedProfileData = {
      preferredName: formData.preferredName,
      dateOfBirth: formData.dateOfBirth,
      location: formData.location,
      medicalHistory: formData.medicalHistory.filter(item => item.condition || item.notes),
      medications: formData.medications.filter(item => item.name || item.dosage || item.schedule),
      allergies: formData.allergies.filter(allergy => allergy),
      caregiverContacts: formData.caregiverContacts.filter(
        contact => contact.name || contact.phone || contact.email
      ),
      accessibility: formData.accessibility,
      medicalReports: formData.medicalReports,
    };
  
    const finalFormData = new FormData();
    finalFormData.append('name', formData.fullName);
    finalFormData.append('email', formData.email);
    finalFormData.append('password', formData.password);
  
    Object.entries(cleanedProfileData).forEach(([key, value]) => {
      if (key === 'medicalReports') {
        // Append all files under the same field name 'profile[medicalReports]'
        value.forEach(file => {
          finalFormData.append('profile[medicalReports]', file);
        });
      } else {
        finalFormData.append(`profile[${key}]`, JSON.stringify(value));
      }
    });
  
    console.log('Submitting final data:');
    for (let pair of finalFormData.entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }
  
    try {
      const response = await axios.post('http://localhost:5000/api/users/register', finalFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      localStorage.setItem('token', response.data.token);
      setSuccess('✨ Account created successfully! Welcome to your journey...');
      setTimeout(() => navigate('/journal'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="auth-step">
            <h2>Create Account</h2>
            <p>Join our caring community</p>
            <div className="form-group">
              <label htmlFor="fullName">
                <AnimatedIcon path={icons.user} /> Full Name
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange(e, 'simple')}
                  placeholder="Enter your full name"
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                <div className="input-focus-effect"></div>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="email">
                <AnimatedIcon path={icons.email} /> Email Address
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => handleChange(e, 'simple')}
                  placeholder="Enter your email address"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                <div className="input-focus-effect"></div>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="password">
                <AnimatedIcon path={icons.password} /> Password
              </label>
              <div className="input-wrapper password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => handleChange(e, 'simple')}
                  placeholder="Create a password (6+ characters)"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
                <div className="input-focus-effect"></div>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">
                <AnimatedIcon path={icons.password} /> Confirm Password
              </label>
              <div className="input-wrapper password-input">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange(e, 'simple')}
                  placeholder="Enter password again"
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
                <div className="input-focus-effect"></div>
              </div>
            </div>
            <button type="submit" className="auth-button" disabled={loading}>
              <span className="button-text">{loading ? 'Processing...' : 'Next'}</span>
              <span className="button-shine"></span>
            </button>
          </div>
        );
      case 2:
        return (
          <div className="setup-step">
            <h2>Let’s Get to Know You</h2>
            <div className="form-group">
              <label>Preferred Name:</label>
              <input
                name="preferredName"
                value={formData.preferredName}
                onChange={(e) => handleChange(e, 'simple')}
                placeholder="What do you like to be called?"
              />
            </div>
            <div className="form-group">
              <label>Birthday:</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange(e, 'simple')}
              />
            </div>
            <div className="form-group">
              <label>Location:</label>
              <input
                name="location"
                value={formData.location}
                onChange={(e) => handleChange(e, 'simple')}
                placeholder="Where do you live?"
              />
            </div>
            <button className="back-button" onClick={handleBack}>
              Back
            </button>
            <button type="submit" className="next-button" disabled={loading}>
              Next
            </button>
          </div>
        );
      case 3:
        return (
          <div className="setup-step">
            <h2>Your Health Matters</h2>
            <div className="form-group">
              <label>Medical Condition:</label>
              <input
                value={formData.medicalHistory[0].condition}
                data-field="condition"
                name="medicalHistory"
                onChange={(e) => handleChange(e, 'objectArray', 0)}
                placeholder="e.g., Diabetes"
              />
              <input
                value={formData.medicalHistory[0].notes}
                data-field="notes"
                name="medicalHistory"
                onChange={(e) => handleChange(e, 'objectArray', 0)}
                placeholder="Any notes?"
              />
            </div>
            <div className="form-group">
              <label>Medication:</label>
              <input
                value={formData.medications[0].name}
                data-field="name"
                name="medications"
                onChange={(e) => handleChange(e, 'objectArray', 0)}
                placeholder="e.g., Aspirin"
              />
              <input
                value={formData.medications[0].schedule}
                data-field="schedule"
                name="medications"
                onChange={(e) => handleChange(e, 'objectArray', 0)}
                placeholder="e.g., Daily at 8 AM"
              />
            </div>
            <div className="form-group">
              <label>Allergy:</label>
              <input
                value={formData.allergies[0]}
                name="allergies"
                onChange={(e) => handleChange(e, 'array', 0)}
                placeholder="e.g., Peanuts"
              />
            </div>
            <div className="form-group">
              <label>Caregiver:</label>
              <input
                value={formData.caregiverContacts[0].name}
                data-field="name"
                name="caregiverContacts"
                onChange={(e) => handleChange(e, 'objectArray', 0)}
                placeholder="Name"
              />
              <input
                value={formData.caregiverContacts[0].phone}
                data-field="phone"
                name="caregiverContacts"
                onChange={(e) => handleChange(e, 'objectArray', 0)}
                placeholder="Phone"
              />
            </div>
            <div className="form-group">
              <label>Medical Reports (PDFs):</label>
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileChange}
              />
              {formData.medicalReports.length > 0 && (
                <ul>
                  {formData.medicalReports.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              )}
            </div>
            <button className="back-button" onClick={handleBack}>
              Back
            </button>
            <button type="submit" className="next-button" disabled={loading}>
              Next
            </button>
          </div>
        );
      case 4:
        return (
          <div className="setup-step">
            <h2>Make It Comfortable</h2>
            <div className="form-group">
              <label>Font Size:</label>
              <select
                name="fontSize"
                value={formData.accessibility.fontSize}
                onChange={(e) => handleChange(e, 'accessibility')}
              >
                <option value="Large">Large</option>
                <option value="Extra Large">Extra Large</option>
              </select>
            </div>
            <div className="form-group">
              <label>Color Scheme:</label>
              <select
                name="colorScheme"
                value={formData.accessibility.colorScheme}
                onChange={(e) => handleChange(e, 'accessibility')}
              >
                <option value="Soothing Pastels">Soothing Pastels</option>
                <option value="High Contrast">High Contrast</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.accessibility.voiceActivation}
                  onChange={handleCheckboxChange}
                />
                Enable Voice Activation
              </label>
            </div>
            <button className="back-button" onClick={handleBack}>
              Back
            </button>
            <button type="submit" className="next-button" disabled={loading}>
              {loading ? 'Creating Account...' : 'Finish'}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="auth-container">
      <div className="vintage-background"></div>
      <div className="floating-shapes"></div>
      <div className="auth-card">
        <h1 className="welcome-title">Sign Up</h1>
        <p className="auth-subtitle">Let’s create your account</p>
        <div className="quote-container">
          <p className="inspirational-quote">{quote}</p>
        </div>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <div className="step-indicator">Step {step} of 4</div>
        <form onSubmit={handleSubmit} className="auth-form">
          {renderStep()}
        </form>
        {step === 1 && (
          <div className="auth-alt-option">
            <p>Already have an account?</p>
            <button className="text-button" onClick={switchToLogin}>
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;