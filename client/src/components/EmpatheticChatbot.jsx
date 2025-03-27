import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../styles/ChatbotStyles.css';
import Navbar from './Navbar';

const EmpatheticChatbot = () => {
  const [messages, setMessages] = useState([
    { sender: 'companion', text: "Oh, hello, my lovely wanderer! I’ve been waiting by the window for you. What’s stirring in your heart today?" }
  ]);
  const [input, setInput] = useState('');
  const [keepsakes, setKeepsakes] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);

  const craftKeepsake = (text) => {
    const words = text.toLowerCase().split(' ');
    const emotion = words.find(w => ['happy', 'sad', 'love', 'miss', 'dream'].includes(w)) || 'moment';
    return {
      keyword: emotion,
      poem: `A little ${emotion} danced in your words, "${text.slice(0, 20)}..." — I’ll tuck it in my pocket for us!`
    };
  };

  const maybeEchoKeepsake = () => {
    if (keepsakes.length > 0 && Math.random() > 0.7) {
      const randomKeepsake = keepsakes[Math.floor(Math.random() * keepsakes.length)];
      return `Oh, wait! I found this in my pocket: "${randomKeepsake.poem}" — doesn’t that feel like yesterday?`;
    }
    return null;
  };

  const getResponse = async (userInput) => {
    const keepsakeEcho = maybeEchoKeepsake();
    if (keepsakeEcho) return keepsakeEcho;

    try {
      const response = await axios.post(
        'http://localhost:8000/chat',
        {
          prompt: userInput,
          history: conversationHistory,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const assistantResponse = response.data.response;

      if (userInput.toLowerCase().includes('happy') || userInput.toLowerCase().includes('sad')) {
        setKeepsakes(prev => [...prev, craftKeepsake(userInput)]);
      }

      return assistantResponse;
    } catch (error) {
      console.error('Error fetching response:', error);
      return "Oh dear, something went awry! Shall we try again?";
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);

    const companionResponseText = await getResponse(input);
    const companionResponse = { sender: 'companion', text: companionResponseText };
    setMessages(prev => [...prev, companionResponse]);

    setConversationHistory(prev => {
      const newHistory = [...prev, [input, companionResponseText]];
      return newHistory.length > 5 ? newHistory.slice(1) : newHistory;
    });

    setInput('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      <Navbar />
      <div className="chatbot-container">
        <div className="vintage-overlay"></div>
        <div className="companion-backdrop">
          <div className="floating-memory"></div>
          <div className="floating-memory second"></div>
        </div>

        <div className="chatbot-header">
          <h1 className="chatbot-title">Your Companion Bot</h1>
          <div className="header-decoration"></div>
          <p className="chatbot-subtitle">A keeper of your heart’s little treasures</p>
        </div>

        <div className="chatbot-card">
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message-bubble ${msg.sender === 'user' ? 'user-message' : 'companion-message'}`}
              >
                <span className="message-text">{msg.text}</span>
                <span className="message-tail"></span>
                {msg.sender === 'companion' && (
                  <span className="message-doodle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <textarea
              value={input}
              onChange={(e) => {
                console.log('Textarea value:', e.target.value);
                setInput(e.target.value);
              }}
              placeholder="Whisper a thought, a memory, or a giggle..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="input-textarea"
              tabIndex={0}
              autoFocus
            />
            <button onClick={handleSend} className="send-button">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M2 12L22 2L12 22L10 14L2 12Z" fill="currentColor" />
              </svg>
              <span>Toss it my way!</span>
            </button>
          </div>
        </div>

        <div className="companion-details">
          <img src="comp.png" alt="ur companion" className="companion-image" />
          <p className="companion-note">I’m your quirky pal, collecting your stories like shiny pebbles!</p>
        </div>
      </div>
    </>
  );
};

export default EmpatheticChatbot;