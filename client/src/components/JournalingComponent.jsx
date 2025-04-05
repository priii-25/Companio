import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../styles/JournalingStyles.css'; // Ensure this path is correct
import Navbar from './Navbar'; // Ensure this path is correct

// Enhanced animated icons with more nostalgic/cute feel
const icons = {
  camera: "M12 15.2C13.8 15.2 15.2 13.8 15.2 12C15.2 10.2 13.8 8.8 12 8.8C10.2 8.8 8.8 10.2 8.8 12C8.8 13.8 10.2 15.2 12 15.2ZM9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9Z",
  gallery: "M22 16V4C22 2.9 21.1 2 20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16ZM14.5 11L11 15.51 8.5 12.5 5 17H19L14.5 11Z", // Updated gallery icon
  microphone: "M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM11 5C11 4.45 11.45 4 12 4C12.55 4 13 4.45 13 5V11C13 11.55 12.55 12 12 12C11.45 12 11 11.55 11 11V5ZM17 11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11H5C5 14.53 7.61 17.43 11 17.9V21H13V17.9C16.39 17.43 19 14.53 19 11H17Z",
  save: "M17 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3ZM19 19H5V5H16.17L19 7.83V19ZM12 12C10.34 12 9 13.34 9 15C9 16.66 10.34 18 12 18C13.66 18 15 16.66 15 15C15 13.34 13.66 12 12 12ZM6 6H15V10H6V6Z",
  heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  polaroid: "M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 14H4V7h4.05l1.83-2h4.24l1.83 2H20v12zM12 8c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z",
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.7L5.82 21 12 17.27z", // Updated star
  people: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  recall: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-14h2v5h5v2h-5v5h-2v-5H6v-2h5V6z", // Updated recall icon (clock rewind)
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
  const [withPeople, setWithPeople] = useState([]); // State for the "Who was with you?" input
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
  const [capturing, setCapturing] = useState(false); // State for webcam capture in progress
  const fileInputRef = useRef(null);
  const journalCardRef = useRef(null);
  const recognitionRef = useRef(null);
  const currentFieldRef = useRef(null); // To track which field is recording voice input

  const [showRecallOptions, setShowRecallOptions] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personMemories, setPersonMemories] = useState([]);
  const [peopleList, setPeopleList] = useState([]); // List of unique people from saved memories
  const [recalling, setRecalling] = useState(false); // State for recall process in progress

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
    console.log('Fetching memories...');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to view your memories.');
      return;
    }

    try {
      setLoading(true); // Indicate loading while fetching
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get('http://localhost:5000/api/journal', config);
      setMemories(response.data);
      // Extract unique people names for the recall list
      const uniquePeople = [...new Set(response.data.flatMap(memory => memory.withPeople || []).filter(Boolean))];
      setPeopleList(uniquePeople);
      setError('');
      console.log('Memories fetched successfully. People list:', uniquePeople);
    } catch (error) {
      console.error('Error fetching memories:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        setError('Failed to fetch memories. Please try again later.');
      }
      setMemories([]); // Clear memories on error
      setPeopleList([]); // Clear people list on error
    } finally {
      setLoading(false);
    }
  };

  // --- useEffect Hooks ---

  // Fetch memories on initial load if logged in
  useEffect(() => {
    console.log('Initializing JournalingComponent...');
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Token found, fetching initial memories...');
      fetchMemories();
    } else {
      console.log('No token found, user needs to log in.');
      setError('Please log in to start preserving your memories.');
    }

    // Set initial prompt and interval
    const randomIndex = Math.floor(Math.random() * journalPrompts.length);
    setPrompt(journalPrompts[randomIndex]);
    const promptInterval = setInterval(() => {
      const newIndex = Math.floor(Math.random() * journalPrompts.length);
      setPrompt(journalPrompts[newIndex]);
    }, 20000);

    // Play initial sound
    const pageTurnSound = new Audio('/sounds/page-turn.mp3');
    pageTurnSound.volume = 0.3;
    pageTurnSound.play().catch(e => console.log('Audio autoplay prevented:', e));

    // Initialize Speech Recognition
    console.log('Checking for SpeechRecognition support...');
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      console.log('SpeechRecognition is supported.');
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Process speech after user stops talking
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      console.log('SpeechRecognition initialized.');

      let hasResult = false; // Flag to track if a result was actually received

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started for field:', currentFieldRef.current);
        // Optionally add visual feedback here
      };

      recognitionRef.current.onresult = (event) => {
        console.log('Speech recognition result received:', event.results);
        hasResult = true; // Mark that we got a result
        if (event.results.length > 0) {
          const transcript = event.results[0][0].transcript.trim();
          console.log('Transcript:', transcript, 'Confidence:', event.results[0][0].confidence);

          const field = currentFieldRef.current; // Use the ref to know which field to update
          if (field === 'withPeople') {
            console.log('Updating withPeople with transcript:', transcript);
            // Split by comma and trim, filter out empty strings
            const peopleArray = transcript.split(',').map(name => name.trim()).filter(name => name);
            console.log('Parsed people array:', peopleArray);
            setWithPeople(peopleArray);
          } else if (field === 'journalText') {
            console.log('Updating journalText with transcript:', transcript);
            setJournalText(prev => prev ? `${prev} ${transcript}` : transcript);
          } else {
            console.log('No target field for speech input, transcript ignored.');
          }
        } else {
          console.log('No results in speech recognition event.');
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error, 'Message:', event.message);
        let userMessage = `Speech recognition failed: ${event.error}`;
        if (event.error === 'no-speech') {
          userMessage = 'No speech detected. Please try speaking clearly.';
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          userMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
        } else if (event.error === 'network') {
          userMessage = 'Network error during speech recognition. Please check your connection.';
        }
        setError(userMessage);
        // Reset state even on error
        currentFieldRef.current = null;
        setIsRecording(null);
        console.log('isRecording set to null after error.');
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended.');
        if (!hasResult && isRecording) { // Only show error if it ended without results *while* it was supposed to be recording
            console.warn('Speech recognition ended without producing results.');
           // Optionally set an error: setError('Did not catch that. Please try again.');
        }
        // Always reset state when recognition ends
        currentFieldRef.current = null;
        setIsRecording(null);
        console.log('isRecording set to null after end.');
        hasResult = false; // Reset flag for next time
      };
    } else {
      console.log('SpeechRecognition is NOT supported in this browser.');
      // Optionally disable mic buttons if not supported
    }

    // WebSocket Connection
    let websocket;
    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = 3000; // Increased retry interval slightly

    const connectWebSocket = () => {
      console.log('Attempting to connect to WebSocket...');
      // Ensure the WebSocket server address is correct
      websocket = new WebSocket('ws://localhost:5000');

      websocket.onopen = () => {
        console.log('WebSocket connected successfully');
        retryCount = 0; // Reset retries on successful connection
      };

      // --- THE CORE UPDATE IS HERE ---
      websocket.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'frameCaptured') {
            console.log('Frame captured message received. Fetching image...');
            const token = localStorage.getItem('token');
            if (!token) {
              setError('Please log in to capture photos.');
              setCapturing(false); // Stop loading indicator
              return;
            }
            // Delay slightly to ensure file is ready/renamed on server
            setTimeout(() => {
              fetch('http://localhost:5000/api/captured-frame', {
                headers: { Authorization: `Bearer ${token}` }
              })
                .then(response => {
                  if (!response.ok) {
                    if (response.status === 401) throw new Error('Unauthorized: Please log in again.');
                    if (response.status === 404) throw new Error('Captured frame not found on server.');
                    throw new Error(`Failed to fetch frame: ${response.statusText}`);
                  }
                  return response.blob();
                })
                .then(blob => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setImage(reader.result); // Display the image
                    // Don't set capturing false here yet, wait for recognition result
                    console.log('Captured image displayed. Waiting for recognition result...');
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
                    setError('Captured image not found. Please try capturing again.');
                  } else {
                    setError('Failed to load captured image: ' + err.message);
                  }
                  setCapturing(false); // Stop loading indicator on fetch error
                  if (recalling) setRecalling(false); // Also stop recall indicator if it was active
                });
            }, 1500); // 1.5 second delay

          } else if (data.type === 'faceRecognition') {
            console.log('Face recognition result received:', data.result);
            setCapturing(false); // Stop capturing indicator *after* recognition result
             if (recalling) setRecalling(false); // Stop recalling indicator if it was active

            if (data.result && data.result.faces && data.result.faces.length > 0) {
              // --- Auto-fill Logic ---
              // Extract *all* recognized names from the result
              const recognizedNames = data.result.faces
                .filter(face => face.recognized && face.name) // Filter for recognized faces with valid names
                .map(face => face.name);                     // Extract the names

              console.log('Recognized names found:', recognizedNames);

              // Update the 'withPeople' state for the current journal entry form
              if (recognizedNames.length > 0) {
                console.log('Auto-filling "With People" field with:', recognizedNames);
                setWithPeople(recognizedNames); // Update the state, this triggers re-render of the input
              } else {
                  console.log('No recognized faces with names in the result. "With People" field not auto-filled.');
                 // Optionally clear the field if no one known is recognized:
                 // setWithPeople([]);
              }
              // --- End Auto-fill Logic ---

              // --- Existing Recall Logic (using the names just extracted) ---
              const firstRecognizedName = recognizedNames[0]; // Use the first recognized name for recall trigger
              if (recalling && firstRecognizedName) {
                console.log(`Recalling memories triggered for: ${firstRecognizedName}`);
                fetchMemoriesByPerson(firstRecognizedName); // fetchMemoriesByPerson handles setting recalling to false on completion/error
              } else if (recalling) {
                // This case means recall was active, but no recognized person was found
                setError('No recognized person found for recall.');
                // setRecalling(false); // Already handled above
              }
              // --- End Existing Recall Logic ---

            } else {
              // This case means no faces were detected or none were recognized
              console.log('No faces detected or no recognizable faces in the result.');
               // Optionally clear the field:
               // setWithPeople([]);
              if (recalling) {
                 setError('No faces detected for recall.');
                 // setRecalling(false); // Already handled above
              }
            }
          }
          // Handle other potential message types from WebSocket
          else if (data.type === 'newPersonPrompt') {
              console.log('Backend requested name for new person index:', data.subImageIndex);
              // TODO: Implement UI prompt if needed
          } else {
              console.log('Received unknown WebSocket message type:', data.type);
          }

        } catch (e) {
          console.error('Error parsing WebSocket message or processing result:', e);
          setError('Error processing data from the server.');
          setCapturing(false); // Stop loading indicators on error
          if (recalling) setRecalling(false);
        }
      };
      // --- END OF CORE UPDATE ---


      websocket.onclose = (event) => {
        console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason, 'Was Clean:', event.wasClean);
        // Implement robust retry logic
        if (!event.wasClean && retryCount < maxRetries) { // Only retry if connection was lost unexpectedly
          setTimeout(() => {
            retryCount++;
            console.log(`WebSocket connection lost. Retrying (${retryCount}/${maxRetries})...`);
            connectWebSocket();
          }, retryInterval * Math.pow(2, retryCount - 1)); // Exponential backoff
        } else if (!event.wasClean) {
          console.error('WebSocket connection failed after multiple retries.');
          setError('Cannot connect to the real-time server. Features like webcam capture might not work.');
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Don't automatically retry on error, onclose will handle unexpected closures
        setError('WebSocket connection error. Check the server.');
        websocket.close(); // Ensure connection is closed on error
      };
    };

    connectWebSocket(); // Initial connection attempt

    // Cleanup function
    return () => {
      console.log('Cleaning up JournalingComponent...');
      clearInterval(promptInterval);
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        console.log('Closing WebSocket connection.');
        websocket.close();
      }
      if (recognitionRef.current) {
        console.log('Stopping speech recognition.');
        recognitionRef.current.stop(); // Stop recognition if active
        // Clean up event listeners to prevent memory leaks
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Card tilt effect
  useEffect(() => {
    const card = journalCardRef.current;
    if (!card) return;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const tiltX = (x - centerX) / 25; // Reduced tilt intensity slightly
      const tiltY = (y - centerY) / 25;
      card.style.transform = `perspective(1000px) rotateX(${-tiltY}deg) rotateY(${tiltX}deg) scale3d(1.03, 1.03, 1.03)`;
      card.style.transition = 'transform 0.1s ease-out'; // Smooth transition on move
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      card.style.transition = 'transform 0.5s ease-in-out'; // Smooth return transition
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []); // Runs once when the card ref is available

  // --- Event Handlers ---

  // Handle mobile camera capture
  const handleCapturePhoto = () => {
    console.log('handleCapturePhoto triggered (mobile/fallback)');
    // This uses the standard file input trick to trigger the device camera
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Prioritize back camera
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result);
          // Clear other fields when a new photo is captured this way? Optional.
          // setJournalText('');
          // setWithPeople([]);
          // setMood('');
        }
        reader.readAsDataURL(file);
        const shutterSound = new Audio('/sounds/camera-shutter.mp3');
        shutterSound.volume = 0.5;
        shutterSound.play().catch(e => console.log('Audio play prevented:', e));
      }
    };
    input.click();
  };

  // Trigger hidden file input for gallery selection
  const handleSelectFromGallery = () => {
    console.log('handleSelectFromGallery triggered');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection from gallery
  const handleFileChange = (e) => {
    console.log('handleFileChange triggered');
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        // Clear other fields when a new photo is selected? Optional.
        // setJournalText('');
        // setWithPeople([]);
        // setMood('');
      }
      reader.readAsDataURL(file);
      const pageFlipSound = new Audio('/sounds/page-flip.mp3');
      pageFlipSound.volume = 0.3;
      pageFlipSound.play().catch(e => console.log('Audio play prevented:', e));
    }
  };

  // Handle webcam capture via backend
  const handleCaptureFromWebcam = async () => {
    console.log('handleCaptureFromWebcam triggered');
    setError(''); // Clear previous errors
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to use webcam capture.');
      return;
    }
    if (capturing || recalling) {
        console.log('Capture or recall already in progress.');
        return; // Prevent multiple simultaneous captures
    }

    setCapturing(true); // Show loading state
    setImage(null); // Clear previous image before capturing new one
    setWithPeople([]); // Clear people field before new capture
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Set a timeout for the request itself on the client-side
      const response = await axios.post('http://localhost:5000/api/face-recognition/capture', {}, { ...config, timeout: 90000 }); // 90 second timeout
      console.log('Capture request sent successfully. Waiting for WebSocket messages...');
      // Note: Success here only means the request was *sent*. The actual result comes via WebSocket.
      // setCapturing(false) will be called in the WebSocket handler.
    } catch (error) {
      console.error('Error initiating webcam capture request:', error.response?.data || error.message);
       if (error.code === 'ECONNABORTED') {
           setError('Webcam capture timed out. Please try again.');
       } else if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        setError('Failed to start webcam capture: ' + (error.response?.data?.error || error.message));
      }
      setCapturing(false); // Stop loading indicator on error initiating request
    }
    // No finally block needed here, state is managed via WebSocket messages
  };

  // Handle voice input toggle
  const handleVoiceInput = (field) => {
    console.log('handleVoiceInput triggered for field:', field);
    setError(''); // Clear previous errors

    if (!recognitionRef.current) {
      setError('Speech recognition is not available on this browser.');
      return;
    }

    // If recording is active and it's for a *different* field, stop it first.
    if (isRecording && isRecording !== field) {
      console.log('Stopping previous recording for:', isRecording);
      recognitionRef.current.stop();
      // Start the new one after a brief delay to allow the old one to fully stop
      setTimeout(() => startRecognition(field), 100);
    }
    // If recording is active for the *same* field, stop it.
    else if (isRecording === field) {
      console.log('Stopping recording for:', field);
      recognitionRef.current.stop();
      // State (isRecording, currentFieldRef) will be reset in the 'onend' handler
    }
    // If not currently recording, start it.
    else {
      startRecognition(field);
    }
  };

  // Helper function to start speech recognition
  const startRecognition = (field) => {
    if (!recognitionRef.current) return;
    console.log('Attempting to start speech recognition for:', field);
    currentFieldRef.current = field; // Set the target field *before* starting
    setIsRecording(field); // Update state to reflect recording status
    try {
      recognitionRef.current.start();
      console.log('SpeechRecognition start() called.');
    } catch (err) {
      // Catch potential errors during start (e.g., already started)
      console.error('Error starting speech recognition:', err);
      setError('Could not start voice input: ' + err.message);
      currentFieldRef.current = null; // Reset target field on error
      setIsRecording(null); // Reset recording state on error
    }
  };

  // Toggle favorite status
  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
    const heartSound = new Audio('/sounds/heart.mp3');
    heartSound.volume = 0.3;
    heartSound.play().catch(e => console.log('Audio play prevented:', e));
  };

  // Apply photo filter
  const applyFilter = (selectedFilter) => {
    console.log('Applying filter:', selectedFilter);
    setFilter(selectedFilter);
  };

  // Save the journal entry
  const handleSaveMemory = async () => {
    console.log('handleSaveMemory triggered');
    setError(''); // Clear previous errors
    setSuccess('');

    if (!image) {
      setError('Please add a photo to your memory.');
      return;
    }
    if (!journalText.trim()) {
      setError('Please write something about your memory.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to save your memory.');
      return;
    }

    setLoading(true); // Show saving indicator

    // Ensure withPeople is an array of strings
    const peopleToSave = Array.isArray(withPeople) ? withPeople : (withPeople ? String(withPeople).split(',').map(s => s.trim()).filter(Boolean) : []);

    console.log('Saving memory with data:', { image: '...', text: journalText, withPeople: peopleToSave, mood, filter, isFavorited, weatherEffect });

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(
        'http://localhost:5000/api/journal',
        {
          image, // Send base64 string
          text: journalText,
          withPeople: peopleToSave,
          mood,
          filter,
          isFavorited,
          weatherEffect
        },
        config
      );

      console.log('Memory saved successfully:', response.data);
      setSuccess('✨ Memory beautifully preserved!');
      if (journalCardRef.current) {
        journalCardRef.current.classList.add('success-animation'); // Add visual feedback
      }

      const successSound = new Audio('/sounds/success.mp3');
      successSound.volume = 0.5;
      successSound.play().catch(e => console.log('Audio play prevented:', e));

      // Reset form and fetch updated memories after a delay
      setTimeout(() => {
        setImage(null);
        setJournalText('');
        setWithPeople([]);
        setMood('');
        setFilter('none');
        setIsFavorited(false);
        setWeatherEffect('');
        setSuccess('');
        if (journalCardRef.current) {
          journalCardRef.current.classList.remove('success-animation');
        }
        fetchMemories(); // Refresh the list of memories
      }, 2500);

    } catch (error) {
      console.error('Error saving memory:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        setError('Unable to save your memory. Please try again. ' + (error.response?.data?.message || ''));
      }
    } finally {
      setLoading(false); // Hide saving indicator
    }
  };

  // Fetch memories specifically for a selected person
  const fetchMemoriesByPerson = async (personName) => {
    console.log('Fetching memories specifically for person:', personName);
    setRecalling(true); // Indicate recall is in progress
    setError('');
    setPersonMemories([]); // Clear previous person's memories

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to recall memories.');
        setRecalling(false);
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Fetch all memories again (could be optimized if backend supports filtering)
      const response = await axios.get('http://localhost:5000/api/journal', config);
      const filteredMemories = response.data.filter(memory =>
        memory.withPeople && memory.withPeople.includes(personName)
      );

      if (filteredMemories.length > 0) {
        console.log(`Found ${filteredMemories.length} memories with ${personName}`);
        setPersonMemories(filteredMemories);
        setSelectedPerson(personName); // Set the currently viewed person
        const recallSound = new Audio('/sounds/memory-recall.mp3');
        recallSound.volume = 0.4;
        recallSound.play().catch(e => console.log('Audio play prevented:', e));
      } else {
        console.log(`No memories found with ${personName}`);
        setError(`No memories found featuring ${personName}.`);
        setSelectedPerson(personName); // Still set the person, but show no memories
        setPersonMemories([]);
      }
      setShowRecallOptions(false); // Close the modal after selection

    } catch (error) {
      console.error('Error fetching person-specific memories:', error);
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        setError('Failed to recall memories. Please try again.');
      }
      setSelectedPerson(null); // Reset selected person on error
    } finally {
      setRecalling(false); // Stop recall indicator
    }
  };

  // Handle selecting a person from the list in the modal
  const handleSelectPerson = (person) => {
    console.log('handleSelectPerson triggered for:', person);
    if (!recalling) { // Prevent action if already recalling
      fetchMemoriesByPerson(person);
    }
  };

  // Handle recall initiated by webcam scan
  const handleRecallFromWebcam = async () => {
    console.log('handleRecallFromWebcam triggered');
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to use webcam recall.');
      return;
    }
     if (capturing || recalling) {
        console.log('Capture or recall already in progress.');
        return; // Prevent multiple simultaneous actions
    }

    setRecalling(true); // Show recall loading state
    setShowRecallOptions(false); // Close modal immediately
    setImage(null); // Clear current image/form
    setJournalText('');
    setWithPeople([]);

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
       // Set a timeout for the request itself on the client-side
      const response = await axios.post('http://localhost:5000/api/face-recognition/capture', {}, { ...config, timeout: 90000 }); // 90 second timeout
      console.log('Recall capture request sent. Waiting for WebSocket messages...');
      // Success means the request was sent. Recognition result and memory fetch trigger via WebSocket.
      // setRecalling(false) will be handled by the WebSocket message handler or fetchMemoriesByPerson
    } catch (error) {
      console.error('Error initiating recall capture:', error);
        if (error.code === 'ECONNABORTED') {
           setError('Webcam recall scan timed out. Please try again.');
       } else if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        setError('Failed to start webcam scan for recall: ' + (error.response?.data?.error || error.message));
      }
      setRecalling(false); // Stop recall indicator on error initiating request
    }
  };

  // Render weather effect overlay
  const renderWeatherEffect = () => {
    if (!weatherEffect) return null;
    return (
      <div className={`weather-effect ${weatherEffect}`}>
        {/* Render elements based on weatherEffect value */}
        {weatherEffect === 'rain' && Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="raindrop" style={{ left: `${Math.random() * 100}%`, animationDuration: `${0.7 + Math.random() * 0.6}s`, animationDelay: `${Math.random() * 1.5}s` }}></div>
        ))}
        {weatherEffect === 'snow' && Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="snowflake" style={{ left: `${Math.random() * 100}%`, animationDuration: `${4 + Math.random() * 6}s`, animationDelay: `${Math.random() * 5}s`, opacity: `${0.5 + Math.random() * 0.5}` }}></div>
        ))}
        {weatherEffect === 'sunshine' && <div className="sunshine-overlay"></div>}
        {weatherEffect === 'leaves' && Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={`falling-leaf leaf-${i % 3 + 1}`} style={{ left: `${Math.random() * 100}%`, animationDuration: `${5 + Math.random() * 7}s`, animationDelay: `${Math.random() * 6}s`, transform: `scale(${0.7 + Math.random() * 0.6}) rotate(${Math.random() * 360}deg)` }}></div>
        ))}
      </div>
    );
  };

  // --- JSX Structure ---
  return (
    <>
      <Navbar />
      <div className="journal-container">
        <div className="vintage-background"></div>
        {/* <div className="floating-shapes"></div> Optional decorative elements */}
        {renderWeatherEffect()}

        <div className="journal-header">
          <h1 className="vintage-title">Memory Keeper</h1>
          <div className="decorative-line"></div>
        </div>

        {/* --- Journal Creation Card --- */}
        <div ref={journalCardRef} className="journal-card vintage-paper">
          <div className="card-decoration"></div>
          <div className="paper-texture"></div>
          <div className="card-corner top-left"></div>
          <div className="card-corner top-right"></div>
          <div className="card-corner bottom-left"></div>
          <div className="card-corner bottom-right"></div>

          <div className="journal-title-wrapper">
            <AnimatedIcon path={icons.polaroid} className="title-icon" />
            <h2 className="welcome-title">My Cherished Moments</h2> {/* Changed to h2 */}
            <AnimatedIcon path={icons.polaroid} className="title-icon" />
          </div>

          <p className="journal-subtitle">Capture the little things that warm your heart</p>

          <div className="prompt-container">
            <div className="prompt-decoration left"></div>
            <p className="journal-prompt">{prompt}</p>
            <div className="prompt-decoration right"></div>
          </div>

          {/* --- Status Messages --- */}
          {success && (
            <div className="status-message success-message">
              <AnimatedIcon path={icons.heart} />
              {success}
            </div>
          )}
          {error && (
            <div className="status-message error-message">
              <span>⚠️ {error}</span>
              {error.includes('log in') && (
                <button
                  className="login-prompt-button"
                  onClick={() => window.location.href = '/login'} // Simple redirect
                >
                  Log In
                </button>
              )}
            </div>
          )}

          {/* --- Journal Form --- */}
          <div className="journal-form">
            {/* Image Display Area */}
            <div className={`image-container ${filter}`}>
              {image ? (
                <>
                  <img
                    src={image}
                    alt="Memory Preview"
                    className={`memory-image ${filter}`}
                  />
                  <button
                    className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
                    onClick={toggleFavorite}
                    title={isFavorited ? "Remove from favorites" : "Mark as favorite"}
                  >
                    <AnimatedIcon path={icons.heart} />
                  </button>
                </>
              ) : capturing ? (
                  <div className="image-placeholder loading-placeholder">
                      <div className="spinner"></div>
                      <p>Capturing from webcam...</p>
                  </div>
              ) : (
                <div className="image-placeholder">
                  <AnimatedIcon path={icons.polaroid} className="placeholder-icon" />
                  <p>Add a photo of your special moment</p>
                </div>
              )}
            </div>

            {/* Filter Options (only show if image exists) */}
            {image && !capturing && (
              <div className="filter-options">
                <p className="filter-label">Photo style:</p>
                <div className="filter-buttons">
                  {['none', 'sepia', 'polaroid', 'faded', 'blackwhite'].map(f => (
                     <button
                        key={f}
                        className={`filter-button ${filter === f ? 'active' : ''}`}
                        onClick={() => applyFilter(f)}
                        title={f === 'none' ? 'Original' : f.charAt(0).toUpperCase() + f.slice(1)}
                      >
                        {f === 'none' ? 'Original' : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Action Buttons */}
            <div className="photo-actions">
              <button
                className="action-button camera-button"
                onClick={handleCapturePhoto}
                title="Use device camera"
                disabled={capturing || recalling}
              >
                <AnimatedIcon path={icons.camera} />
                <span>Capture</span>
              </button>
              <button
                className="action-button gallery-button"
                onClick={handleSelectFromGallery}
                title="Select from your photo gallery"
                disabled={capturing || recalling}
              >
                <AnimatedIcon path={icons.gallery} />
                <span>Gallery</span>
              </button>
              <button
                className="action-button webcam-capture-button"
                onClick={handleCaptureFromWebcam}
                disabled={capturing || recalling}
                title="Use computer webcam"
              >
                <AnimatedIcon path={icons.camera} />
                <span>{capturing ? 'Capturing...' : 'Webcam'}</span>
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Form Fields */}
            <div className={`form-group ${focusedField === 'withPeople' ? 'focused' : ''}`}>
              <label htmlFor="with-people">
                <AnimatedIcon path={icons.people} className="form-icon" />
                Who was with you? (Names separated by commas)
              </label>
              <div className="input-wrapper">
                <input
                  id="with-people"
                  name="with-people"
                  type="text" // Keep as text input
                  value={Array.isArray(withPeople) ? withPeople.join(', ') : withPeople} // Ensure value is string
                  onChange={(e) => setWithPeople(e.target.value.split(',').map(name => name.trim()))} // Update state as array on change
                  placeholder="e.g., Whom did you made good memories with today?"
                  onFocus={() => setFocusedField('withPeople')}
                  onBlur={() => setFocusedField(null)}
                  className="vintage-input"
                  disabled={loading || capturing || recalling}
                />
                <button
                  className={`mic-button ${isRecording === 'withPeople' ? 'recording' : ''}`}
                  onClick={() => handleVoiceInput('withPeople')}
                  title="Use voice input for names"
                  disabled={!recognitionRef.current || loading || capturing || recalling} // Disable if not supported or busy
                >
                  <AnimatedIcon path={icons.microphone} />
                </button>
                <div className="input-focus-effect"></div>
                {/* Input decorations removed for cleaner look, can be added back */}
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
                  placeholder="What makes this moment special? What details stand out?"
                  onFocus={() => setFocusedField('journal')}
                  onBlur={() => setFocusedField(null)}
                  rows={5} // Increased rows slightly
                  className="vintage-input"
                   disabled={loading || capturing || recalling}
                />
                <button
                  className={`mic-button ${isRecording === 'journalText' ? 'recording' : ''}`}
                  onClick={() => handleVoiceInput('journalText')}
                  title="Use voice input for journal entry"
                   disabled={!recognitionRef.current || loading || capturing || recalling}
                >
                  <AnimatedIcon path={icons.microphone} />
                </button>
                <div className="input-focus-effect"></div>
              </div>
            </div>

            {/* Mood Selector */}
            <div className="mood-selector">
              <label>How did this moment make you feel?</label>
              <div className="mood-buttons">
                {moodOptions.map((option) => (
                  <button
                    key={option}
                    className={`mood-button ${mood === option ? 'selected' : ''}`}
                    onClick={() => setMood(option)}
                    disabled={loading || capturing || recalling}
                  >
                    {option}
                  </button>
                ))}
                 {mood && ( // Show clear button only if a mood is selected
                    <button
                      className="mood-button clear-mood"
                      onClick={() => setMood('')}
                      title="Clear mood selection"
                      disabled={loading || capturing || recalling}
                    >
                      ✕
                    </button>
                  )}
              </div>
            </div>

            {/* Ambiance Selector */}
            <div className="ambiance-selector">
              <label htmlFor="weather-effect">Choose an ambiance:</label>
              <select
                id="weather-effect"
                value={weatherEffect}
                onChange={(e) => setWeatherEffect(e.target.value)}
                className="vintage-select"
                 disabled={loading || capturing || recalling}
              >
                {weatherEffects.map((effect) => (
                  <option key={effect.value} value={effect.value}>
                    {effect.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Save Button */}
            <div className="form-footer">
              <button
                className="save-button"
                onClick={handleSaveMemory}
                disabled={loading || !image || !journalText.trim() || capturing || recalling} // Disable if loading, no image/text, or capturing
              >
                <AnimatedIcon path={icons.save} />
                <span className="button-text">{loading ? 'Preserving...' : 'Save This Memory'}</span>
                <span className="button-shine"></span>
              </button>
            </div>
          </div>
        </div>

        {/* --- Recall Section Trigger --- */}
        <button
          className="fancy-recall-button cute-recall"
          onClick={() => {
              if (!showRecallOptions) {
                  // Reset selected person when opening the modal unless already recalling
                  if (!recalling) setSelectedPerson(null);
                  fetchMemories(); // Refresh people list when opening
              }
              setShowRecallOptions(!showRecallOptions);
          }}
          disabled={recalling || capturing} // Disable if busy
          title="Recall memories associated with a person"
        >
          <AnimatedIcon path={icons.recall} className="recall-icon" />
          <span>Recall With...</span>
          <span className="button-shine"></span>
          <span className="cute-sparkle">✨</span>
        </button>

        {/* --- Recall Options Modal --- */}
        {showRecallOptions && (
          <div className="recall-modal-overlay" onClick={() => setShowRecallOptions(false)}> {/* Close on overlay click */}
            <div className="recall-modal" onClick={(e) => e.stopPropagation()}> {/* Prevent closing when clicking inside modal */}
              <div className="modal-header">
                <h3>Recall Memories</h3>
                <button
                  className="modal-close-button"
                  onClick={() => setShowRecallOptions(false)}
                  title="Close"
                >
                  ✕
                </button>
              </div>
              <div className="modal-content">
                <div className="people-list">
                  <h4>Select a person:</h4>
                  {peopleList.length > 0 ? (
                    <div className="people-buttons-container"> {/* Added container for scrolling */}
                        {peopleList.map(person => (
                        <button
                            key={person}
                            className="person-button"
                            onClick={() => handleSelectPerson(person)}
                            disabled={recalling} // Disable while recalling
                        >
                            {person}
                        </button>
                        ))}
                    </div>
                  ) : (
                    <p className="no-people-message">Save memories with people first to recall them here.</p>
                  )}
                </div>
                <div className="modal-separator">OR</div>
                <button
                  className="action-button webcam-recall-button"
                  onClick={handleRecallFromWebcam}
                  disabled={recalling} // Disable while recalling
                  title="Scan face with webcam to recall memories"
                >
                  <AnimatedIcon path={icons.camera} />
                  <span>{recalling ? 'Scanning...' : 'Scan with Webcam'}</span>
                </button>
                {recalling && <div className="spinner small-spinner"></div>} {/* Small spinner during recall */}
              </div>
            </div>
          </div>
        )}

        {/* --- Memories Display Section --- */}
        <div className="memories-section">
          <div className="memories-header">
            <AnimatedIcon path={icons.heart} className="memories-icon" />
            <h2 className="memories-title">
              {selectedPerson ? `Moments with ${selectedPerson}` : 'My Treasured Moments'}
            </h2>
             <AnimatedIcon path={icons.heart} className="memories-icon" />
              {selectedPerson && ( // Add button to show all memories again
                 <button onClick={() => setSelectedPerson(null)} className="show-all-button" title="Show all memories">Show All</button>
             )}
          </div>

          {/* Conditional Rendering based on selectedPerson and memories */}
          {selectedPerson && personMemories.length === 0 && !recalling ? (
            <div className="no-memories">
              <AnimatedIcon path={icons.polaroid} className="empty-icon" />
              <p>No memories found featuring {selectedPerson}.</p>
            </div>
          ) : selectedPerson ? (
            <div className="memories-grid polaroid-stack">
              {personMemories.map((memory) => (
                <div key={memory._id} className={`memory-card polaroid-card ${memory.filter || ''}`}>
                  <div className="memory-image-container">
                    <img
                      src={memory.image}
                      alt={`Memory from ${new Date(memory.createdAt).toLocaleDateString()}`}
                      className={`memory-thumbnail`} // Filter applied by parent card class
                      loading="lazy" // Lazy load images
                    />
                    {memory.isFavorited && (
                      <div className="memory-favorite" title="Favorite memory">
                        <AnimatedIcon path={icons.heart} />
                      </div>
                    )}
                  </div>
                  <div className="memory-content">
                     {memory.mood && (
                      <span className={`memory-mood mood-tag-${memory.mood.toLowerCase()}`}>
                        {memory.mood}
                      </span>
                    )}
                    <p className="memory-text">{memory.text}</p>
                    <p className="memory-date">
                      {new Date(memory.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : memories.length === 0 && !loading ? (
            <div className="no-memories">
              <AnimatedIcon path={icons.polaroid} className="empty-icon" />
              <p>Your memory collection is waiting for its first treasure...</p>
              {!localStorage.getItem('token') && <p>Please log in to save and view memories.</p>}
            </div>
          ) : loading && memories.length === 0 ? (
               <div className="loading-memories">
                 <div className="spinner"></div>
                 <p>Loading your treasures...</p>
               </div>
          ): (
            // Display all memories
            <div className="memories-grid">
              {memories.map((memory) => (
                <div key={memory._id} className={`memory-card ${memory.filter || ''}`}>
                  <div className="memory-image-container">
                    <img
                      src={memory.image}
                      alt={`Memory from ${new Date(memory.createdAt).toLocaleDateString()}`}
                      className={`memory-thumbnail`}
                      loading="lazy"
                    />
                    {memory.isFavorited && (
                      <div className="memory-favorite" title="Favorite memory">
                        <AnimatedIcon path={icons.heart} />
                      </div>
                    )}
                  </div>
                  <div className="memory-content">
                    {memory.withPeople && memory.withPeople.length > 0 && (
                      <p className="memory-with">
                        <AnimatedIcon path={icons.people} className="memory-icon small-icon" />
                        With: {memory.withPeople.join(', ')}
                      </p>
                    )}
                    <p className="memory-text">{memory.text}</p>
                     {memory.mood && (
                       <span className={`memory-mood mood-tag-${memory.mood.toLowerCase()}`}>
                        {memory.mood}
                      </span>
                    )}
                    <div className="memory-footer">
                      <p className="memory-date">
                        {new Date(memory.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </p>
                      {/* Add delete/edit buttons here if needed */}
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