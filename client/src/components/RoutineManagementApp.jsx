import React, { useState, useEffect } from 'react';
import '../styles/RoutineManagementStyles.css';
import SoundTherapyComponent from './SoundTherapyComponent';

// Weather emoticons (keeping the original paths)
const weatherEmojis = {
  sunny: 'summer.png',
  rainy: '/emoticons/rainy-emoticon.png',
  snowy: '/emoticons/snowy-emoticon.png',
  cloudy: '/emoticons/cloudy-emoticon.png'
};

// Initial routines data (expanded for calendar)
const initialRoutines = {
  "2025-03-21": [
    { id: 1, time: "8:00 AM", task: "Morning Tea", completed: false },
    { id: 2, time: "10:00 AM", task: "Garden Walk", completed: true },
    { id: 3, time: "12:00 PM", task: "Lunch Time", completed: false },
    { id: 4, time: "3:00 PM", task: "Story Hour", completed: false }
  ],
  "2025-03-22": [
    { id: 5, time: "9:00 AM", task: "Breakfast", completed: false },
    { id: 6, time: "11:00 AM", task: "Call Family", completed: false }
  ]
};

// Memory-inspired poetry (expanded with longer content)
const memoryPoems = [
  { 
    title: "Whispers of Yesterday", 
    lines: [
      "The sun once danced on old porch swings,", 
      "Laughter echoed through summer's wings,",
      "Golden days of youth now past,",
      "Memories made forever to last.",
      "Fireflies glowed in evening's embrace,",
      "Time moved slow with gentle grace."
    ] 
  },
  { 
    title: "Rainy Days", 
    lines: [
      "Rain tapped soft on windows clear,", 
      "Stories told by voices dear,",
      "Droplets racing down the glass,",
      "Cozy moments we amassed.",
      "Thunder rumbling far away,",
      "Safe inside we chose to stay."
    ] 
  },
  { 
    title: "Snowflakes", 
    lines: [
      "Snow fell slow, a blanket white,", 
      "Footsteps crunching in the night,",
      "Winter's breath on frosted panes,",
      "Childhood joy that still remains.",
      "Mittened hands and rosy cheeks,",
      "Silent wonder when nature speaks."
    ] 
  },
  { 
    title: "Golden Afternoons", 
    lines: [
      "Fields of gold beneath the sky,", 
      "Kites we flew so high, so high,",
      "Picnic baskets filled with treats,",
      "Summer days and gentle heats.",
      "Shadows lengthened with the sun,",
      "Memories made when day was done."
    ] 
  }
];

// Memories for the companion chatbot
const memories = [
  "Your first bike was blue with white tires. You got it for your 7th birthday.",
  "You loved to bake cookies with your grandmother every Sunday afternoon.",
  "Your favorite book as a child was 'The Little Prince'.",
  "You spent summers at Lake Winnipesaukee where you learned to swim.",
  "You had a golden retriever named Max who followed you everywhere.",
  "You won the spelling bee in 4th grade with the word 'necessary'.",
  "Your first job was at the local library, shelving books.",
  "You met your best friend Maria in college during freshman orientation.",
  "Your wedding day was sunny but the reception had an unexpected rain shower.",
  "Your favorite holiday is Thanksgiving because you love cooking for family."
];

const RoutineManagementApp = () => {
  const [routines, setRoutines] = useState(initialRoutines);
  const [selectedDate, setSelectedDate] = useState("2025-03-21"); // Default to today
  const [newRoutine, setNewRoutine] = useState({ time: "", task: "" });
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [animate, setAnimate] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { text: "Hello there! It's nice to see you today. How are you feeling?", isUser: false }
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [selectedPoem, setSelectedPoem] = useState(null);

  // Hardcoded weather
  const currentWeather = { condition: "sunny", temperature: "75°F", description: "A bright and cheerful day" };

  // Add subtle animation effect when changing dates
  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 300);
    return () => clearTimeout(timer);
  }, [selectedDate]);

  const handleToggleComplete = (id) => {
    const updatedRoutines = { ...routines };
    const dayRoutines = updatedRoutines[selectedDate].map(routine =>
      routine.id === id ? { ...routine, completed: !routine.completed } : routine
    );
    updatedRoutines[selectedDate] = dayRoutines;
    setRoutines(updatedRoutines);
  };

  const handleAddRoutine = () => {
    if (!newRoutine.time || !newRoutine.task) return;
    const updatedRoutines = { ...routines };
    const newId = Math.max(...Object.values(routines).flat().map(r => r.id), 0) + 1;
    updatedRoutines[selectedDate] = [
      ...(updatedRoutines[selectedDate] || []),
      { id: newId, ...newRoutine, completed: false }
    ];
    setRoutines(updatedRoutines);
    setNewRoutine({ time: "", task: "" });
  };

  const handleEditRoutine = (routine) => {
    setEditingRoutine(routine);
    setNewRoutine({ time: routine.time, task: routine.task });
  };

  const handleSaveEdit = () => {
    if (!newRoutine.time || !newRoutine.task || !editingRoutine) return;
    const updatedRoutines = { ...routines };
    updatedRoutines[selectedDate] = updatedRoutines[selectedDate].map(r =>
      r.id === editingRoutine.id ? { ...r, ...newRoutine } : r
    );
    setRoutines(updatedRoutines);
    setEditingRoutine(null);
    setNewRoutine({ time: "", task: "" });
  };

  const handleStorytellingClick = () => {
    alert("Opening Interactive Storytelling...");
  };

  const handleChatToggle = () => {
    setShowChatModal(!showChatModal);
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    // Add user message
    setChatMessages([...chatMessages, { text: currentMessage, isUser: true }]);
    setCurrentMessage("");
    
    // Simulate companion response with memories
    setTimeout(() => {
      // Generate a random response that occasionally includes memories
      const randomMemory = Math.random() > 0.5 
        ? `I remember that ${memories[Math.floor(Math.random() * memories.length)]} ` 
        : "";
      
      const responses = [
        "That's interesting! " + randomMemory + "How does that make you feel?",
        randomMemory + "Would you like to talk more about that?",
        "I understand. " + randomMemory + "Is there anything specific on your mind today?",
        "Thank you for sharing that with me. " + randomMemory + "What else would you like to talk about?",
        "I'm here for you. " + randomMemory + "How can I help you today?"
      ];
      
      const response = responses[Math.floor(Math.random() * responses.length)];
      
      setChatMessages(prev => [...prev, { text: response, isUser: false }]);
    }, 1000);
  };

  const handleViewFullPoem = (poem) => {
    setSelectedPoem(poem);
  };

  const handleClosePoem = () => {
    setSelectedPoem(null);
  };

  // Generate simple calendar days (7 days starting from today)
  const getCalendarDays = () => {
    const today = new Date("2025-03-21");
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return date.toISOString().split("T")[0];
    });
  };

  return (
    <div className="routine-container">
      <div className="vintage-overlay"></div>

      <div className="routine-header">
        <h1 className="routine-title">My Daily Companion</h1>
        <div className="header-decoration"></div>
      </div>

      {/* Talk to Companion Button */}
      <button className="companion-chat-button" onClick={handleChatToggle}>
        Talk to Your Companion
      </button>

      {/* Main Layout: Calendar on Left, Today's Routine on Right */}
      <div className="routine-layout">
        {/* Calendar Section */}
        <div className="calendar-section">
          <h2 className="section-title">My Week</h2>
          <div className="calendar-grid">
            {getCalendarDays().map(date => (
              <div
                key={date}
                className={`calendar-day ${date === selectedDate ? 'selected' : ''}`}
                onClick={() => setSelectedDate(date)}
              >
                <span className="day-number">{new Date(date).getDate()}</span>
                <span className="day-name">{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                {(routines[date] || []).length > 0 && (
                  <span className="routine-count">{routines[date].length}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Today's Routine Section */}
        <div className="routine-section">
          <h2 className="section-title">
            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
          
          {(routines[selectedDate] || []).length === 0 ? (
            <p className="no-routines">No activities scheduled for today.</p>
          ) : (
            <ul className={`routine-list ${animate ? 'animate-fade' : ''}`}>
              {(routines[selectedDate] || []).map(routine => (
                <li key={routine.id} className="routine-item">
                  <input
                    type="checkbox"
                    checked={routine.completed}
                    onChange={() => handleToggleComplete(routine.id)}
                    className="routine-checkbox"
                  />
                  <span className={`routine-time ${routine.completed ? 'completed' : ''}`}>
                    {routine.time}
                  </span>
                  <span className={`routine-task ${routine.completed ? 'completed' : ''}`}>
                    {routine.task}
                  </span>
                  <button className="edit-button" onClick={() => handleEditRoutine(routine)}>
                    Edit
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add/Edit Routine Form */}
          <div className="routine-form">
            <input
              type="time"
              value={newRoutine.time}
              onChange={e => setNewRoutine({ ...newRoutine, time: e.target.value })}
              className="routine-input"
            />
            <input
              type="text"
              value={newRoutine.task}
              onChange={e => setNewRoutine({ ...newRoutine, task: e.target.value })}
              placeholder="Add a task..."
              className="routine-input"
            />
            <button
              className="add-button"
              onClick={editingRoutine ? handleSaveEdit : handleAddRoutine}
            >
              {editingRoutine ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      </div>

      {/* Weather and Poetry in a more balanced layout */}
      <div className="routine-layout">
        {/* Weather Section - Image will be below text */}
        <div className="weather-card">
          <div className="weather-content">
            <div className="weather-details">
              <h2 className="weather-title">Today's Weather</h2>
              <p className="weather-condition">{currentWeather.condition}</p>
              <p className="weather-temp">{currentWeather.temperature}</p>
              <p className="weather-desc">{currentWeather.description}</p>
            </div>
          </div>
          <div className="weather-image-container">
            <img src={weatherEmojis[currentWeather.condition]} alt="weather" className="weather-emoticon" />
          </div>
        </div>

        {/* Poetry Section - With view full poem functionality */}
        <div className="poetry-card">
          <div className="poetry-header">
            <h2 className="poetry-title">Memories in Verse</h2>
          </div>
          <div className="poetry-list">
            {memoryPoems.map((poem, index) => (
              <div key={index} className="poetry-preview">
                <h3 className="poem-title">{poem.title}</h3>
                <p className="poem-preview-text">{poem.lines[0]} {poem.lines[1]}...</p>
                <button onClick={() => handleViewFullPoem(poem)} className="view-poem-button">
                  Read Full Poem
                </button>
              </div>
            ))}
          </div>
          <button className="storytelling-button" onClick={handleStorytellingClick}>
            Go to Interactive Storytelling
          </button>
        </div>
      </div>

      {/* Sound Therapy Section */}
      <div className="routine-layout">
        <SoundTherapyComponent />
      </div>

      {/* Companion Chat Modal */}
      {showChatModal && (
        <div className="chat-modal-overlay">
          <div className="chat-modal">
            <div className="chat-modal-header">
              <h3>Your Companion</h3>
              <button className="close-modal-button" onClick={handleChatToggle}>×</button>
            </div>
            <div className="chat-messages">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.isUser ? 'user-message' : 'companion-message'}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="chat-input-area">
              <input
                type="text"
                placeholder="Type your message..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="chat-input"
              />
              <button onClick={handleSendMessage} className="send-button">
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Poem Modal */}
      {selectedPoem && (
        <div className="poem-modal-overlay">
          <div className="poem-modal">
            <div className="poem-modal-header">
              <h3>{selectedPoem.title}</h3>
              <button className="close-modal-button" onClick={handleClosePoem}>×</button>
            </div>
            <div className="poem-modal-content">
              {selectedPoem.lines.map((line, index) => (
                <p key={index} className="poem-line">{line}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineManagementApp;