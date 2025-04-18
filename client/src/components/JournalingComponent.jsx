import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../styles/JournalingStyles.css';
import Navbar from './Navbar';
import API_URL from '../config';

// Enhanced animated icons with more nostalgic/cute feel
const icons = {
  camera: "M12 15.2C13.8 15.2 15.2 13.8 15.2 12C15.2 10.2 13.8 8.8 12 8.8C10.2 8.8 8.8 10.2 8.8 12C8.8 13.8 10.2 15.2 12 15.2ZM9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9Z",
  gallery: "M22 16V4C22 2.9 21.1 2 20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z",
  microphone: "M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM11 5C11 4.45 11.45 4 12 4C12.55 4 13 4.45 13 5V11C13 11.55 12.55 12 12 12C11.45 12 11 11.55 11 11V5ZM17 11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11H5C5 14.53 7.61 17.43 11 17.9V21H13V17.9C16.39 17.43 19 14.53 19 11H17Z",
  save: "M17 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3ZM19 19H5V5H16.17L19 7.83V19ZM12 12C10.34 12 9 13.34 9 15C9 16.66 10.34 18 12 18C13.66 18 15 15.66 15 15C15 13.34 13.66 12 12 12ZM6 6H15V10H6V6Z",
  heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  polaroid: "M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 14H4V7h4.05l1.83-2h4.24l1.83 2H20v12zM12 8c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z",
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4,82L12 17.27z",
  people: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  recall: "M21 8H3V6h18v2zm-2 4H5v-2h14v2zm-4 4H9v-2h6v2zm6 4H3v-2h18v2zM10 18h4v2h-4v-2zm0-12h4V12h-4v2z",
};

// More nostalgic and comforting prompts
const journalPrompts = [
  "What made your heart feel warm today?",
  "Share a memory that makes you smile whenever you think of it...",
  "If this moment could be a scent, what would it smell like?",
  "What small joy did you notice today that others might have missed?",
  "Which song would be the perfect soundtrack to this memory?",
  "What's something about this moment you want your future self to remember?",
  "If you could send a postcard of this moment to your past self, what would you write?",
  "What colors and textures stand out in this memory?",
  "Which person from your past would appreciate hearing about this moment?",
  "If this memory were a page in your life's storybook, what would be its title?",
  "What little detail about this photo brings you the most comfort?",
  "How does this moment connect to your childhood dreams?",
  "What would a hug feel like in this moment?",
  "If this memory were a season, which would it be and why?"
];

const AnimatedIcon = ({ path, className = "" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`action-icon ${className}`}>
    <path d={path} fill="currentColor" />
  </svg>
);

const JournalingComponent = () => {
  const [image, setImage] = useState(null);
  const [journalText, setJournalText] = useState('');
  const [withPeople, setWithPeople] = useState([]);
  const [isRecording, setIsRecording] = useState(null);
  const [memories, setMemories] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('none');
  const [isFavorited, setIsFavorited] = useState(false);
  const [mood, setMood] = useState('');
  const [weatherEffect, setWeatherEffect] = useState('');
  const [capturing, setCapturing] = useState(false);
  const fileInputRef = useRef(null);
  const journalCardRef = useRef(null);
  const recognitionRef = useRef(null);
  const currentFieldRef = useRef(null);

  const [showRecallOptions, setShowRecallOptions] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personMemories, setPersonMemories] = useState([]);
  const [peopleList, setPeopleList] = useState([]);
  const [recalling, setRecalling] = useState(false);

  const moodOptions = [
    "Joyful", "Peaceful", "Nostalgic", "Grateful",
    "Hopeful", "Cozy", "Reflective", "Content",
    "Dreamy", "Inspired"
  ];

  const weatherEffects = [
    { label: "None", value: "" },
    { label: "Gentle Rain", value: "rain" },
    { label: "Soft Snow", value: "snow" },
    { label: "Golden Sunshine", value: "sunshine" },
    { label: "Autumn Leaves", value: "leaves" }
  ];

  const fetchMemories = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to view your memories.');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/api/journal`, config);
      setMemories(response.data);
      const uniquePeople = [...new Set(response.data.flatMap(memory => memory.withPeople || []))];
      setPeopleList(uniquePeople);
      setError('');
    } catch (error) {
      console.error('Error fetching memories:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        setError('Failed to fetch memories. Please try again later.');
      }
    }
  };

  useEffect(() => {
    console.log('State - withPeople:', withPeople);
  }, [withPeople]);

  useEffect(() => {
    console.log('State - journalText:', journalText);
  }, [journalText]);

  useEffect(() => {
    console.log('State - isRecording:', isRecording);
  }, [isRecording]);

  useEffect(() => {
    console.log('Initializing JournalingComponent...');
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Token found, fetching memories...');
      fetchMemories();
    } else {
      console.log('No token found, user needs to log in.');
      setError('Please log in to start preserving your memories.');
    }

    const randomIndex = Math.floor(Math.random() * journalPrompts.length);
    setPrompt(journalPrompts[randomIndex]);
    console.log('Initial prompt set:', journalPrompts[randomIndex]);

    const promptInterval = setInterval(() => {
      const newIndex = Math.floor(Math.random() * journalPrompts.length);
      setPrompt(journalPrompts[newIndex]);
      console.log('New prompt set:', journalPrompts[newIndex]);
    }, 20000);

    const pageTurnSound = new Audio('/sounds/page-turn.mp3');
    pageTurnSound.volume = 0.3;
    pageTurnSound.play().catch(e => console.log('Audio autoplay prevented:', e));

    console.log('Checking for SpeechRecognition support...');
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      console.log('SpeechRecognition is supported in this browser.');
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      console.log('SpeechRecognition initialized with lang: en-US, continuous: false, interimResults: false');

      let hasResult = false;

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started for field (ref):', currentFieldRef.current);
        console.log('Speech recognition started for field (state):', isRecording);
      };

      recognitionRef.current.onresult = (event) => {
        console.log('Speech recognition result received:', event.results);
        hasResult = true;
        if (event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          console.log('Transcript received:', transcript);
          console.log('Confidence:', event.results[0][0].confidence);

          const field = currentFieldRef.current;
          if (field === 'withPeople') {
            console.log('Updating withPeople with transcript:', transcript);
            const peopleArray = transcript.split(', ').filter(name => name.trim());
            console.log('Parsed people array:', peopleArray);
            setWithPeople(peopleArray);
          } else if (field === 'journalText') {
            console.log('Updating journalText with transcript:', transcript);
            setJournalText(prev => {
              const newText = prev ? `${prev} ${transcript}` : transcript;
              console.log('New journalText value:', newText);
              return newText;
            });
          } else {
            console.log('No field is currently recording, ignoring transcript.');
          }
        } else {
          console.log('No results received from speech recognition.');
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          setError('No speech detected. Please try again.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'network') {
          setError('Network error. Please check your internet connection.');
        } else {
          setError(`Speech recognition failed: ${event.error}`);
        }
        currentFieldRef.current = null;
        setIsRecording(null);
        console.log('isRecording set to null after error.');
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended.');
        if (!hasResult) {
          setError('Speech recognition ended without results. Please try again.');
        }
        currentFieldRef.current = null;
        setIsRecording(null);
        console.log('isRecording set to null after end.');
        hasResult = false;
      };
    } else {
      console.log('SpeechRecognition is NOT supported in this browser.');
      setError('Speech recognition is not supported in this browser.');
    }

    let websocket;
    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = 2000;

    const connectWebSocket = () => {
      console.log('Connecting to WebSocket...');
      const websocket = new WebSocket(`${API_URL.replace(/^http/, 'ws')}/api/websocket`);
      websocket.onopen = () => {
        console.log('WebSocket connected');
        retryCount = 0;
      };
      websocket.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'frameCaptured') {
            const token = localStorage.getItem('token');
            if (!token) {
              setError('Please log in to capture photos.');
              setCapturing(false);
              return;
            }
            setTimeout(() => {
              fetch(`${API_URL}/api/captured-frame`, {
                headers: { Authorization: `Bearer ${token}` }
              })
                .then(response => {
                  if (!response.ok) {
                    if (response.status === 401) {
                      throw new Error('Unauthorized: Please log in again.');
                    } else if (response.status === 404) {
                      throw new Error('Captured frame not found on server.');
                    }
                    throw new Error('Failed to fetch frame');
                  }
                  return response.blob();
                })
                .then(blob => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setImage(reader.result);
                    setCapturing(false);
                    const shutterSound = new Audio('/sounds/camera-shutter.mp3');
                    shutterSound.volume = 0.5;
                    shutterSound.play().catch(e => console.log('Audio play prevented:', e));
                  };
                  reader.readAsDataURL(blob);
                })
                .catch(err => {
                  console.error('Error fetching captured frame:', err.message);
                  if (err.message.includes('Unauthorized')) {
                    setError('Session expired. Please log in again.');
                    localStorage.removeItem('token');
                  } else if (err.message.includes('not found')) {
                    setError('Captured image not found on server. Please try capturing again.');
                  } else {
                    setError('Failed to load captured image: ' + err.message);
                  }
                  setCapturing(false);
                });
            }, 2000);
          } else if (data.type === 'faceRecognition') {
            console.log('Face recognition result:', data.result);
            if (data.result.faces && data.result.faces.length > 0) {
              const recognizedName = data.result.faces.find(face => face.recognized)?.name;
              if (recognizedName) {
                fetchMemoriesByPerson(recognizedName);
              } else {
                setError('No recognized person found in the capture.');
                setRecalling(false);
              }
            } else {
              setError('No faces detected in the capture.');
              setRecalling(false);
            }
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
          setError('Error receiving face recognition result.');
          setRecalling(false);
        }
      };
      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        if (retryCount < maxRetries) {
          setTimeout(() => {
            console.log(`Retrying WebSocket connection (${retryCount + 1}/${maxRetries})...`);
            retryCount++;
            connectWebSocket();
          }, retryInterval);
        } else {
          setError('Failed to connect to WebSocket server after multiple attempts.');
        }
      };
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        websocket.close();
      };
    };

    connectWebSocket();

    return () => {
      console.log('Cleaning up JournalingComponent...');
      clearInterval(promptInterval);
      if (websocket) websocket.close();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!journalCardRef.current) return;

      const card = journalCardRef.current;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const tiltX = (x - centerX) / 20;
      const tiltY = (y - centerY) / 20;

      card.style.transform = `perspective(1000px) rotateX(${-tiltY}deg) rotateY(${tiltX}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = () => {
      if (!journalCardRef.current) return;
      journalCardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    };

    const card = journalCardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (card) {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  const handleCapturePhoto = () => {
    console.log('handleCapturePhoto triggered');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'camera';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setImage(reader.result);
        reader.readAsDataURL(file);

        const shutterSound = new Audio('/sounds/camera-shutter.mp3');
        shutterSound.volume = 0.5;
        shutterSound.play().catch(e => console.log('Audio play prevented:', e));
      }
    };
    input.click();
  };

  const handleSelectFromGallery = () => {
    console.log('handleSelectFromGallery triggered');
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    console.log('handleFileChange triggered');
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);

      const pageFlipSound = new Audio('/sounds/page-flip.mp3');
      pageFlipSound.volume = 0.3;
      pageFlipSound.play().catch(e => console.log('Audio play prevented:', e));
    }
  };

  const handleCaptureFromWebcam = async () => {
    console.log('handleCaptureFromWebcam triggered');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to use webcam capture.');
      return;
    }

    setCapturing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Capture timed out')), 90000);
      });

      await Promise.race([
        axios.post('http://localhost:5000/api/face-recognition/capture', {}, config),
        timeoutPromise
      ]);
    } catch (error) {
      console.error('Error capturing frame from webcam:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        setError('Failed to capture image from webcam: ' + (error.response?.data?.error || error.message));
      }
    } finally {
      setCapturing(false);
    }
  };

  const handleVoiceInput = (field) => {
    console.log('handleVoiceInput triggered for field:', field);
    console.log('Current isRecording state:', isRecording);
    console.log('recognitionRef.current exists:', !!recognitionRef.current);

    if (!recognitionRef.current) {
      console.log('SpeechRecognition not available.');
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording && isRecording !== field) {
      console.log('Stopping previous speech recognition session for field:', isRecording);
      try {
        recognitionRef.current.stop();
        console.log('SpeechRecognition stop() called for previous session.');
      } catch (err) {
        console.error('Error stopping previous speech recognition:', err);
        setError('Failed to stop previous speech recognition: ' + err.message);
      }
      setTimeout(() => {
        startRecognition(field);
      }, 100);
    } else if (isRecording === field) {
      console.log('Stopping speech recognition for field:', field);
      try {
        recognitionRef.current.stop();
        console.log('SpeechRecognition stop() called.');
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
        setError('Failed to stop speech recognition: ' + err.message);
      }
      currentFieldRef.current = null;
      setIsRecording(null);
    } else {
      startRecognition(field);
    }
  };

  const startRecognition = (field) => {
    console.log('Starting speech recognition for field:', field);
    currentFieldRef.current = field;
    setIsRecording(field);
    try {
      recognitionRef.current.start();
      console.log('SpeechRecognition start() called.');
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError('Failed to start speech recognition: ' + err.message);
      currentFieldRef.current = null;
      setIsRecording(null);
    }
  };

  const toggleFavorite = () => {
    console.log('toggleFavorite triggered');
    setIsFavorited(!isFavorited);

    const heartSound = new Audio('/sounds/heart.mp3');
    heartSound.volume = 0.3;
    heartSound.play().catch(e => console.log('Audio play prevented:', e));
  };

  const applyFilter = (selectedFilter) => {
    console.log('applyFilter triggered with filter:', selectedFilter);
    setFilter(selectedFilter);
  };

  const handleSaveMemory = async () => {
    console.log('handleSaveMemory triggered');
    if (!image || !journalText) {
      setError('Please add both a photo and some text to save your memory.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to save your memory.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_URL}/api/journal`, { 
        image, 
        text: journalText,
        withPeople,
        mood,
        filter,
        isFavorited,
        weatherEffect
      }, config);

      setSuccess('✨ Memory beautifully preserved!');
      document.querySelector('.journal-card').classList.add('success-animation');

      const successSound = new Audio('/sounds/success.mp3');
      successSound.volume = 0.5;
      successSound.play().catch(e => console.log('Audio play prevented:', e));

      setTimeout(() => {
        setImage(null);
        setJournalText('');
        setWithPeople([]);
        setSuccess('');
        setFilter('none');
        setIsFavorited(false);
        setMood('');
        setWeatherEffect('');
        fetchMemories();
      }, 2000);
    } catch (error) {
      console.error('Error saving memory:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        setError('Unable to save your memory. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMemoriesByPerson = async (personName) => {
    console.log('fetchMemoriesByPerson triggered for person:', personName);
    setRecalling(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to recall memories.');
        setRecalling(false);
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/api/journal`, config);
      const filteredMemories = response.data.filter(memory => 
        memory.withPeople && memory.withPeople.includes(personName)
      );
      setPersonMemories(filteredMemories);
      setSelectedPerson(personName);
      setShowRecallOptions(false);

      const recallSound = new Audio('/sounds/memory-recall.mp3');
      recallSound.volume = 0.4;
      recallSound.play().catch(e => console.log('Audio play prevented:', e));
    } catch (error) {
      console.error('Error fetching person memories:', error);
      setError('Failed to recall memories. Please try again.');
    } finally {
      setRecalling(false);
    }
  };

  const handleSelectPerson = (person) => {
    console.log('handleSelectPerson triggered for person:', person);
    fetchMemoriesByPerson(person);
  };

  const handleRecallFromWebcam = async () => {
    console.log('handleRecallFromWebcam triggered');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to use webcam recall.');
      return;
    }

    setRecalling(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_URL}/api/face-recognition/capture`, {}, config);
    } catch (error) {
      console.error('Error capturing for recall:', error);
      setError('Failed to capture from cam: ' + (error.response?.data?.error || error.message));
    } finally {
      setRecalling(false);
    }
  };

  const renderWeatherEffect = () => {
    if (!weatherEffect) return null;

    return (
      <div className={`weather-effect ${weatherEffect}`}>
        {weatherEffect === 'rain' && Array(20).fill(0).map((_, i) => (
          <div key={i} className="raindrop" style={{ 
            left: `${Math.random() * 100}%`, 
            animationDuration: `${0.8 + Math.random()}s`,
            animationDelay: `${Math.random()}s`
          }}></div>
        ))}
        {weatherEffect === 'snow' && Array(30).fill(0).map((_, i) => (
          <div key={i} className="snowflake" style={{ 
            left: `${Math.random() * 100}%`, 
            animationDuration: `${3 + Math.random() * 5}s`,
            animationDelay: `${Math.random()}s`
          }}></div>
        ))}
        {weatherEffect === 'sunshine' && Array(5).fill(0).map((_, i) => (
          <div key={i} className="sunshine-ray" style={{ 
            transform: `rotate(${i * 72}deg)` 
          }}></div>
        ))}
        {weatherEffect === 'leaves' && Array(15).fill(0).map((_, i) => (
          <div key={i} className="falling-leaf" style={{ 
            left: `${Math.random() * 100}%`, 
            animationDuration: `${5 + Math.random() * 8}s`,
            animationDelay: `${Math.random() * 5}s`
          }}></div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="journal-container">
        <div className="vintage-background"></div>
        <div className="floating-shapes"></div>
        {renderWeatherEffect()}

        <div className="journal-header">
          <h1 className="vintage-title">Memory Keeper</h1>
          <div className="decorative-line"></div>
        </div>

        <div ref={journalCardRef} className="journal-card vintage-paper">
          <div className="card-decoration"></div>
          <div className="paper-texture"></div>
          <div className="card-corner top-left"></div>
          <div className="card-corner top-right"></div>
          <div className="card-corner bottom-left"></div>
          <div className="card-corner bottom-right"></div>

          <div className="journal-title-wrapper">
            <AnimatedIcon path={icons.polaroid} className="title-icon" />
            <h1 className="welcome-title">My Cherished Moments</h1>
            <AnimatedIcon path={icons.polaroid} className="title-icon" />
          </div>

          <p className="journal-subtitle">Capture the little things that warm your heart</p>

          <div className="prompt-container">
            <div className="prompt-decoration left"></div>
            <p className="journal-prompt">{prompt}</p>
            <div className="prompt-decoration right"></div>
          </div>

          {success && (
            <div className="success-message">
              <AnimatedIcon path={icons.heart} />
              {success}
            </div>
          )}

          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
              {error.includes('log in') && (
                <button 
                  className="login-prompt-button"
                  onClick={() => window.location.href = '/login'}
                >
                  Log In
                </button>
              )}
            </div>
          )}

          <div className="journal-form">
            <div className={`image-container ${filter}`}>
              {image ? (
                <>
                  <img 
                    src={image} 
                    alt="Memory" 
                    className={`memory-image ${filter}`}
                  />
                  <button 
                    className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
                    onClick={toggleFavorite}
                  >
                    <AnimatedIcon path={icons.heart} />
                  </button>
                </>
              ) : (
                <div className="image-placeholder">
                  <AnimatedIcon path={icons.polaroid} className="placeholder-icon" />
                  <p>Add a photo of your special moment</p>
                </div>
              )}
            </div>

            {image && (
              <div className="filter-options">
                <p className="filter-label">Photo style:</p>
                <div className="filter-buttons">
                  <button 
                    className={`filter-button ${filter === 'none' ? 'active' : ''}`} 
                    onClick={() => applyFilter('none')}
                  >
                    Original
                  </button>
                  <button 
                    className={`filter-button ${filter === 'sepia' ? 'active' : ''}`} 
                    onClick={() => applyFilter('sepia')}
                  >
                    Vintage
                  </button>
                  <button 
                    className={`filter-button ${filter === 'polaroid' ? 'active' : ''}`} 
                    onClick={() => applyFilter('polaroid')}
                  >
                    Polaroid
                  </button>
                  <button 
                    className={`filter-button ${filter === 'faded' ? 'active' : ''}`} 
                    onClick={() => applyFilter('faded')}
                  >
                    Dreamy
                  </button>
                  <button 
                    className={`filter-button ${filter === 'blackwhite' ? 'active' : ''}`} 
                    onClick={() => applyFilter('blackwhite')}
                  >
                    Classic
                  </button>
                </div>
              </div>
            )}

            <div className="photo-actions">
              <button 
                className="action-button camera-button" 
                onClick={handleCapturePhoto}
              >
                <AnimatedIcon path={icons.camera} />
                <span>Capture Moment</span>
              </button>
              <button 
                className="action-button gallery-button" 
                onClick={handleSelectFromGallery}
              >
                <AnimatedIcon path={icons.gallery} />
                <span>My Photos</span>
              </button>
              <button 
                className="action-button webcam-capture-button" 
                onClick={handleCaptureFromWebcam}
                disabled={capturing}
              >
                <AnimatedIcon path={icons.camera} />
                <span>{capturing ? 'Capturing...' : 'Capture from cam'}</span>
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            <div className={`form-group ${focusedField === 'withPeople' ? 'focused' : ''}`}>
              <label htmlFor="with-people">
                <AnimatedIcon path={icons.people} className="form-icon" />
                Who was with you?
              </label>
              <div className="input-wrapper">
                <input
                  id="with-people"
                  name="with-people"
                  value={withPeople.join(', ')}
                  onChange={(e) => setWithPeople(e.target.value.split(', ').filter(name => name.trim()))}
                  placeholder="Names of people in this memory"
                  onFocus={() => setFocusedField('withPeople')}
                  onBlur={() => setFocusedField(null)}
                  className="vintage-input"
                />
                <button
                  className={`mic-button ${isRecording === 'withPeople' ? 'recording' : ''}`}
                  onClick={() => handleVoiceInput('withPeople')}
                >
                  <AnimatedIcon path={icons.microphone} />
                </button>
                <div className="input-focus-effect"></div>
                <div className="input-decorations">
                  <div className="input-decoration top-left"></div>
                  <div className="input-decoration top-right"></div>
                  <div className="input-decoration bottom-left"></div>
                  <div className="input-decoration bottom-right"></div>
                </div>
              </div>
            </div>

            <div className={`form-group ${focusedField === 'journal' ? 'focused' : ''}`}>
              <label htmlFor="journal-text">
                <AnimatedIcon path={icons.star} className="form-icon" />
                Tell me about this memory:
              </label>
              <div className="input-wrapper">
                <textarea
                  id="journal-text"
                  name="journal-text"
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  placeholder="What makes this moment tug at your heartstrings? What sensations do you remember?"
                  onFocus={() => setFocusedField('journal')}
                  onBlur={() => setFocusedField(null)}
                  rows={4}
                  className="vintage-input"
                />
                <button
                  className={`mic-button ${isRecording === 'journalText' ? 'recording' : ''}`}
                  onClick={() => handleVoiceInput('journalText')}
                >
                  <AnimatedIcon path={icons.microphone} />
                </button>
                <div className="input-focus-effect"></div>
                <div className="input-decorations">
                  <div className="input-decoration top-left"></div>
                  <div className="input-decoration top-right"></div>
                  <div className="input-decoration bottom-left"></div>
                  <div className="input-decoration bottom-right"></div>
                </div>
              </div>
            </div>

            <div className="mood-selector">
              <label>How did this moment make you feel?</label>
              <div className="mood-buttons">
                {moodOptions.map((option) => (
                  <button
                    key={option}
                    className={`mood-button ${mood === option ? 'selected' : ''}`}
                    onClick={() => setMood(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="ambiance-selector">
              <label>Choose a mood setting:</label>
              <select 
                value={weatherEffect} 
                onChange={(e) => setWeatherEffect(e.target.value)}
                className="vintage-select"
              >
                {weatherEffects.map((effect) => (
                  <option key={effect.value} value={effect.value}>
                    {effect.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-footer">
              <button 
                className="save-button" 
                onClick={handleSaveMemory} 
                disabled={loading}
              >
                <AnimatedIcon path={icons.save} />
                <span className="button-text">{loading ? 'Preserving...' : 'Save This Memory'}</span>
                <span className="button-shine"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Recall With Button */}
        <button 
          className="fancy-recall-button cute-recall" 
          onClick={() => setShowRecallOptions(true)}
        >
          <AnimatedIcon path={icons.recall} className="recall-icon" />
          <span>Recall With...</span>
          <span className="button-shine"></span>
          <span className="cute-sparkle">✨</span>
        </button>

        {/* Modal for Recall Options */}
        {showRecallOptions && (
          <div className="recall-modal-overlay">
            <div className="recall-modal">
              <div className="modal-header">
                <h3>Recall Memories</h3>
                <button 
                  className="modal-close-button"
                  onClick={() => setShowRecallOptions(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-content">
                <div className="people-list">
                  <h4>Choose a person:</h4>
                  {peopleList.length > 0 ? (
                    peopleList.map(person => (
                      <button
                        key={person}
                        className="person-button"
                        onClick={() => handleSelectPerson(person)}
                        disabled={recalling}
                      >
                        {person}
                      </button>
                    ))
                  ) : (
                    <p>No people recorded yet.</p>
                  )}
                </div>
                <button
                  className="action-button webcam-recall-button"
                  onClick={handleRecallFromWebcam}
                  disabled={recalling}
                >
                  <AnimatedIcon path={icons.camera} />
                  <span>{recalling ? 'Recalling...' : 'Scan with Webcam'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="memories-section">
          <div className="memories-header">
            <AnimatedIcon path={icons.heart} className="memories-icon" />
            <h2 className="memories-title">
              {selectedPerson ? `Moments with ${selectedPerson}` : 'Treasured Moments'}
            </h2>
            <AnimatedIcon path={icons.heart} className="memories-icon" />
          </div>

          {selectedPerson && personMemories.length === 0 ? (
            <div className="no-memories">
              <AnimatedIcon path={icons.polaroid} className="empty-icon" />
              <p>No memories found with {selectedPerson} yet...</p>
            </div>
          ) : selectedPerson ? (
            <div className="memories-grid polaroid-stack">
              {personMemories.map((memory) => (
                <div key={memory._id} className="memory-card polaroid-card">
                  <div className="memory-image-container">
                    <img 
                      src={memory.image} 
                      alt="Memory" 
                      className={`memory-thumbnail ${memory.filter || ''}`} 
                    />
                    {memory.isFavorited && (
                      <div className="memory-favorite">
                        <AnimatedIcon path={icons.heart} />
                      </div>
                    )}
                  </div>
                  <div className="memory-content">
                    <p className="memory-text">{memory.text}</p>
                    {memory.mood && (
                      <div className="memory-mood">
                        {memory.mood}
                      </div>
                    )}
                    <p className="memory-date">
                      {new Date(memory.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : memories.length === 0 ? (
            <div className="no-memories">
              <AnimatedIcon path={icons.polaroid} className="empty-icon" />
              <p>Your memory collection is waiting for its first treasure...</p>
            </div>
          ) : (
            <div className="memories-grid">
              {memories.map((memory) => (
                <div key={memory._id} className="memory-card">
                  <div className="memory-image-container">
                    <img 
                      src={memory.image} 
                      alt="Memory" 
                      className={`memory-thumbnail ${memory.filter || ''}`} 
                    />
                    {memory.isFavorited && (
                      <div className="memory-favorite">
                        <AnimatedIcon path={icons.heart} />
                      </div>
                    )}
                  </div>
                  <div className="memory-content">
                    {memory.withPeople && memory.withPeople.length > 0 && (
                      <p className="memory-with">
                        <AnimatedIcon path={icons.people} className="memory-icon" />
                        With: {memory.withPeople.join(', ')}
                      </p>
                    )}
                    <p className="memory-text">{memory.text}</p>
                    {memory.mood && (
                      <div className="memory-mood">
                        {memory.mood}
                      </div>
                    )}
                    <div className="memory-footer">
                      <p className="memory-date">
                        {new Date(memory.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default JournalingComponent;