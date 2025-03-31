import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ProfileStyles.css';
import Navbar from './Navbar';

const ProfileComponent = () => {
  const [profile, setProfile] = useState({});
  const [insights, setInsights] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchInsights();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data);
    } catch (err) {
      setError('Failed to load profile.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/profile/insights', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInsights(response.data);
    } catch (err) {
      console.error('Error fetching insights:', err);
    }
  };

  const handleUpdate = async (updatedProfile) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Append all profile fields to FormData
      Object.entries(updatedProfile).forEach(([key, value]) => {
        if (key === 'medicalReports') {
          value.forEach(file => formData.append('profile[medicalReports]', file));
        } else {
          formData.append(`profile[${key}]`, JSON.stringify(value));
        }
      });

      const response = await axios.put('http://localhost:5000/api/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setProfile(response.data);
      setEditMode(false);
      setError('');
    } catch (err) {
      setError('Failed to update profile.');
      console.error(err);
    }
  };

  if (loading) return <div className="profile-container">Loading...</div>;

  return (
    <>
      <Navbar />
      <div className="profile-container">
        <div className="vintage-background"></div>
        <div className="floating-shapes"></div>

        <div className="profile-header">
          <h1 className="vintage-title">My Profile</h1>
          <div className="decorative-line"></div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Personal Information */}
        <section className="profile-section vintage-paper">
          <h2>Personal Information</h2>
          {editMode ? (
            <PersonalInfoForm profile={profile} onSave={handleUpdate} />
          ) : (
            <div>
              <p><strong>Preferred Name:</strong> {profile.preferredName || 'Not set'}</p>
              <p><strong>Birthday:</strong> {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not set'}</p>
              <p><strong>Location:</strong> {profile.location || 'Not set'}</p>
              <button className="edit-button" onClick={() => setEditMode(true)}>Edit</button>
            </div>
          )}
        </section>

        {/* Medical & Emergency Information */}
        <section className="profile-section vintage-paper">
          <h2>Medical & Emergency</h2>
          {editMode ? (
            <MedicalForm profile={profile} onSave={handleUpdate} />
          ) : (
            <div>
              <p><strong>Conditions:</strong> {profile.medicalHistory?.length ? profile.medicalHistory.map(m => m.condition).join(', ') : 'None'}</p>
              <p><strong>Medications:</strong> {profile.medications?.length ? profile.medicalHistory.map(m => `${m.name}${m.schedule ? ` (${m.schedule})` : ''}`).join(', ') : 'None'}</p>
              <p><strong>Allergies:</strong> {profile.allergies?.length ? profile.allergies.join(', ') : 'None'}</p>
              <p><strong>Caregivers:</strong> {profile.caregiverContacts?.length ? profile.caregiverContacts.map(c => `${c.name}${c.phone ? ` (${c.phone})` : ''}`).join(', ') : 'None'}</p>
              <p>
                <strong>Medical Reports:</strong>{' '}
                {profile.medicalReports?.length ? (
                  <ul>
                    {profile.medicalReports.map((report, index) => (
                      <li key={index}>
                        <a
                          href={`http://localhost:5000/${report.path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#007bff', textDecoration: 'underline' }}
                        >
                          {report.filename}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  'None'
                )}
              </p>
              <button className="edit-button" onClick={() => setEditMode(true)}>Edit</button>
            </div>
          )}
        </section>

        {/* Accessibility Settings */}
        <section className="profile-section vintage-paper">
          <h2>Accessibility</h2>
          {editMode ? (
            <AccessibilityForm profile={profile} onSave={handleUpdate} />
          ) : (
            <div>
              <p><strong>Font Size:</strong> {profile.accessibility?.fontSize || 'Large'}</p>
              <p><strong>Color Scheme:</strong> {profile.accessibility?.colorScheme || 'Soothing Pastels'}</p>
              <p><strong>Voice Activation:</strong> {profile.accessibility?.voiceActivation ? 'Enabled' : 'Disabled'}</p>
              <button className="edit-button" onClick={() => setEditMode(true)}>Edit</button>
            </div>
          )}
        </section>
      </div>
    </>
  );
};

const PersonalInfoForm = ({ profile, onSave }) => {
  const [formData, setFormData] = useState({
    preferredName: profile.preferredName || '',
    dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
    location: profile.location || '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    onSave({ ...profile, ...formData });
  };

  return (
    <div>
      <label>Preferred Name:</label>
      <input name="preferredName" value={formData.preferredName} onChange={handleChange} placeholder="What do you like to be called?" />
      <label>Birthday:</label>
      <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
      <label>Location:</label>
      <input name="location" value={formData.location} onChange={handleChange} placeholder="Where do you live?" />
      <button onClick={handleSubmit}>Save</button>
    </div>
  );
};

const MedicalForm = ({ profile, onSave }) => {
  const [medicalHistory, setMedicalHistory] = useState(profile.medicalHistory?.length ? profile.medicalHistory : [{ condition: '', notes: '' }]);
  const [medications, setMedications] = useState(profile.medications?.length ? profile.medications : [{ name: '', dosage: '', schedule: '' }]);
  const [allergies, setAllergies] = useState(profile.allergies?.length ? profile.allergies : ['']);
  const [caregiverContacts, setCaregiverContacts] = useState(profile.caregiverContacts?.length ? profile.caregiverContacts : [{ name: '', phone: '', email: '' }]);
  const [medicalReports, setMedicalReports] = useState(profile.medicalReports || []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setMedicalReports(files);
  };

  const handleSave = () => {
    onSave({
      ...profile,
      medicalHistory,
      medications,
      allergies,
      caregiverContacts,
      medicalReports,
    });
  };

  return (
    <div>
      <label>Conditions:</label>
      {medicalHistory.map((item, index) => (
        <div key={index}>
          <input
            value={item.condition}
            onChange={(e) => {
              const newHistory = [...medicalHistory];
              newHistory[index].condition = e.target.value;
              setMedicalHistory(newHistory);
            }}
            placeholder="Condition"
          />
          <input
            value={item.notes}
            onChange={(e) => {
              const newHistory = [...medicalHistory];
              newHistory[index].notes = e.target.value;
              setMedicalHistory(newHistory);
            }}
            placeholder="Notes"
          />
        </div>
      ))}
      <label>Medications:</label>
      {medications.map((item, index) => (
        <div key={index}>
          <input
            value={item.name}
            onChange={(e) => {
              const newMeds = [...medications];
              newMeds[index].name = e.target.value;
              setMedications(newMeds);
            }}
            placeholder="Name"
          />
          <input
            value={item.dosage}
            onChange={(e) => {
              const newMeds = [...medications];
              newMeds[index].dosage = e.target.value;
              setMedications(newMeds);
            }}
            placeholder="Dosage"
          />
          <input
            value={item.schedule}
            onChange={(e) => {
              const newMeds = [...medications];
              newMeds[index].schedule = e.target.value;
              setMedications(newMeds);
            }}
            placeholder="Schedule"
          />
        </div>
      ))}
      <label>Allergies:</label>
      {allergies.map((allergy, index) => (
        <input
          key={index}
          value={allergy}
          onChange={(e) => {
            const newAllergies = [...allergies];
            newAllergies[index] = e.target.value;
            setAllergies(newAllergies);
          }}
          placeholder="Allergy"
        />
      ))}
      <label>Caregivers:</label>
      {caregiverContacts.map((contact, index) => (
        <div key={index}>
          <input
            value={contact.name}
            onChange={(e) => {
              const newContacts = [...caregiverContacts];
              newContacts[index].name = e.target.value;
              setCaregiverContacts(newContacts);
            }}
            placeholder="Name"
          />
          <input
            value={contact.phone}
            onChange={(e) => {
              const newContacts = [...caregiverContacts];
              newContacts[index].phone = e.target.value;
              setCaregiverContacts(newContacts);
            }}
            placeholder="Phone"
          />
          <input
            value={contact.email}
            onChange={(e) => {
              const newContacts = [...caregiverContacts];
              newContacts[index].email = e.target.value;
              setCaregiverContacts(newContacts);
            }}
            placeholder="Email"
          />
        </div>
      ))}
      <label>Medical Reports (PDFs):</label>
      <input type="file" accept=".pdf" multiple onChange={handleFileChange} />
      {medicalReports.length > 0 && (
        <ul>
          {medicalReports.map((report, index) => (
            <li key={index}>
              {report.name || (
                <a
                  href={`http://localhost:5000/${report.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#007bff', textDecoration: 'underline' }}
                >
                  {report.filename}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

const AccessibilityForm = ({ profile, onSave }) => {
  const [accessibility, setAccessibility] = useState({
    fontSize: profile.accessibility?.fontSize || 'Large',
    colorScheme: profile.accessibility?.colorScheme || 'Soothing Pastels',
    voiceActivation: profile.accessibility?.voiceActivation || false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAccessibility(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = () => {
    onSave({ ...profile, accessibility });
  };

  return (
    <div>
      <div>
        <label>Font Size:</label>
        <select name="fontSize" value={accessibility.fontSize} onChange={handleChange}>
          <option value="Large">Large</option>
          <option value="Extra Large">Extra Large</option>
        </select>
      </div>
      <div>
        <label>Color Scheme:</label>
        <select name="colorScheme" value={accessibility.colorScheme} onChange={handleChange}>
          <option value="Soothing Pastels">Soothing Pastels</option>
          <option value="High Contrast">High Contrast</option>
        </select>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            name="voiceActivation"
            checked={accessibility.voiceActivation}
            onChange={handleChange}
          />
          Enable Voice Activation
        </label>
      </div>
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default ProfileComponent;