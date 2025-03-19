import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, TextField, Typography, Box } from '@mui/material';
import { Camera, Collections, Save, Mic } from '@mui/icons-material';
import axios from 'axios';

const JournalingComponent = () => {
  const [image, setImage] = useState(null);
  const [journalText, setJournalText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [memories, setMemories] = useState([]); // State to store fetched memories
  const fileInputRef = useRef(null);

  // Fetch memories when the component mounts and after saving
  const fetchMemories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/journal');
      setMemories(response.data);
    } catch (error) {
      console.error('Error fetching memories:', error);
    }
  };

  // Fetch memories on component mount
  useEffect(() => {
    fetchMemories();
  }, []);

  const handleCapturePhoto = () => {
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
      }
    };
    input.click();
  };

  const handleSelectFromGallery = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    if (!isRecording) {
      setIsRecording(true);
      recognition.start();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setJournalText((prev) => prev + ' ' + transcript);
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => setIsRecording(false);
    }
  };

  const handleSaveMemory = async () => {
    if (!image || !journalText) {
      alert('Please add a photo and some text!');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/journal',
        { image, text: journalText }
      );
      console.log('Memory saved:', response.data);
      setImage(null);
      setJournalText('');
      fetchMemories(); // Refetch memories after saving
    } catch (error) {
      console.error('Error saving memory:', error);
      alert('Failed to save memory. Please try again.');
    }
  };

  return (
    <Box className="p-6 m-4 max-w-2xl mx-auto">
      {/* Journal Entry Form */}
      <Card className="p-6 mb-8 bg-blue-50 rounded-xl shadow-lg">
        <Typography variant="h4" className="text-center mb-6 text-blue-800 font-bold">
          My Journal
        </Typography>

        <Box className="flex justify-center mb-8">
          {image ? (
            <img
              src={image}
              alt="Memory"
              className="w-full max-h-80 object-contain rounded-lg border-4 border-blue-200"
            />
          ) : (
            <Box className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg border-4 border-blue-200">
              <Typography variant="h6" className="text-gray-500">
                Add a photo for your memory
              </Typography>
            </Box>
          )}
        </Box>

        <Box className="flex justify-center space-x-6 mb-8">
          <Button
            variant="contained"
            size="large"
            color="primary"
            startIcon={<Camera />}
            onClick={handleCapturePhoto}
            className="text-lg py-3 px-6 rounded-full"
          >
            Take Photo
          </Button>
          <Button
            variant="outlined"
            size="large"
            color="primary"
            startIcon={<Collections />}
            onClick={handleSelectFromGallery}
            className="text-lg py-3 px-6 rounded-full"
          >
            Gallery
          </Button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </Box>

        <Typography variant="h5" className="mb-4 text-blue-800 font-semibold">
          Tell me about this moment:
        </Typography>

        <TextField
          multiline
          rows={4}
          variant="outlined"
          fullWidth
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          placeholder="What makes this moment special? Who is in the photo? When was it taken? How do you feel about it?"
          className="mb-4"
          InputProps={{ style: { fontSize: '1.2rem', lineHeight: '1.8rem' } }}
        />

        <Box className="flex justify-center mb-8">
          <Button
            variant={isRecording ? 'contained' : 'outlined'}
            color={isRecording ? 'secondary' : 'primary'}
            startIcon={<Mic />}
            onClick={handleVoiceInput}
            className="text-lg py-3 px-6 rounded-full"
          >
            {isRecording ? 'Recording...' : 'Speak Your Memory'}
          </Button>
        </Box>

        <Box className="flex justify-center">
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<Save />}
            onClick={handleSaveMemory}
            className="text-xl py-4 px-8 rounded-full"
          >
            Save This Memory
          </Button>
        </Box>
      </Card>

      {/* Recent Memories Section */}
      <Box>
        <Typography variant="h4" className="text-center mb-6 text-blue-800 font-bold">
          Recent Memories
        </Typography>
        {memories.length === 0 ? (
          <Typography variant="h6" className="text-center text-gray-500">
            No memories yet. Start by saving one above!
          </Typography>
        ) : (
          <Box className="space-y-6">
            {memories.map((memory) => (
              <Card key={memory._id} className="p-4 bg-blue-50 rounded-xl shadow-lg">
                <Box className="flex justify-center mb-4">
                  <img
                    src={memory.image}
                    alt="Memory"
                    className="w-full max-h-60 object-contain rounded-lg border-2 border-blue-200"
                  />
                </Box>
                <Typography variant="body1" className="mb-2 text-gray-800">
                  {memory.text}
                </Typography>
                <Typography variant="caption" className="text-gray-500">
                  {new Date(memory.createdAt).toLocaleString()}
                </Typography>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default JournalingComponent;