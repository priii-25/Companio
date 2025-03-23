import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/InteractiveStorytellingStyles.css';

const icons = {
  quill: "M3 17v4h4l11-11-4-4-11 11zm18-14l-3-3-1.41 1.41 3 3L21 3z",
  bookmark: "M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z",
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
};

const AnimatedIcon = ({ path, className = "" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`action-icon ${className}`}>
    <path d={path} fill="currentColor" />
  </svg>
);

// Dummy story with multiple pages
const dummyStoryPages = [
  "Once upon a time, in a land of whispering winds, a young dreamer found a golden key beneath an ancient oak. It shimmered with secrets, promising adventures beyond imagination.",
  "The key led them to a hidden glade where the trees sang lullabies. Each note carried a memory, weaving a tapestry of forgotten tales that danced in the air like fireflies.",
  "In the heart of the glade stood a door, carved with runes that glowed softly. The dreamer turned the key, and the door creaked open, revealing a world bathed in golden light."
];

const dummyStories = [
  {
    pages: dummyStoryPages,
    mood: "Whimsical",
    backdrop: "enchanted"
  },
  {
    pages: [
      "The castle stood tall against a crimson sky, its towers piercing the clouds. A lone knight, clad in silver, ventured forth on a quest for honor.",
      "Guided by a single star that flickered like hope, the knight crossed a bridge of moonlit stone, where shadows whispered secrets of the past.",
      "At the castle gates, a dragon awaited, its scales shimmering like molten gold. The knight raised their sword, ready to face their destiny."
    ],
    mood: "Epic",
    backdrop: "twilight"
  },
  {
    pages: [
      "In a village nestled by the sea, a girl with eyes like the tide discovered a bottle washed ashore. Inside was a map, drawn in glowing ink.",
      "The map led her to a cove where the waves sang of ancient shipwrecks. She dove into the depths, following the light of a bioluminescent pearl.",
      "Beneath the waves, she found a chest of treasures, each piece whispering tales of sailors and storms, a legacy of the ocean’s heart."
    ],
    mood: "Mystical",
    backdrop: "mist"
  }
];

const InteractiveStorytellingApp = () => {
  const [storyPages, setStoryPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [mood, setMood] = useState('');
  const [backdrop, setBackdrop] = useState('');
  const [savedStories, setSavedStories] = useState([]);
  const [isFlipping, setIsFlipping] = useState(false);

  const moodOptions = ["Whimsical", "Epic", "Mystical", "Romantic"];
  const backdropOptions = [
    { label: "Enchanted Forest", value: "enchanted" },
    { label: "Twilight Sky", value: "twilight" },
    { label: "Misty Shores", value: "mist" },
    { label: "Starry Realm", value: "stars" }
  ];

  useEffect(() => {
    const bookOpenSound = new Audio('/sounds/book-open.mp3');
    bookOpenSound.volume = 0.3;
    bookOpenSound.play().catch(e => console.log('Audio autoplay prevented:', e));
  }, []);

  const generateStory = () => {
    const randomIndex = Math.floor(Math.random() * dummyStories.length);
    const story = dummyStories[randomIndex];
    setStoryPages(story.pages);
    setMood(story.mood);
    setBackdrop(story.backdrop);
    setCurrentPage(0);
    setIsFavorited(false);
  };

  const flipPage = (direction) => {
    if (isFlipping || !storyPages.length) return;
    setIsFlipping(true);
    if (direction === 'next' && currentPage < storyPages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else if (direction === 'prev' && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
    setTimeout(() => setIsFlipping(false), 1000);
  };

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
    if (!isFavorited && storyPages.length) {
      setSavedStories([...savedStories, { pages: storyPages, mood, backdrop }]);
    }
  };

  return (
    <div className="storybook-container">
      <div className="storybook-bg">
        <div className="sparkle-layer">
          {Array(15).fill().map((_, i) => (
            <div
              key={i}
              className="sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="storybook-header">
        <h1 className="storybook-title">Enchanted Chronicles</h1>
        <div className="controls">
          <select value={mood} onChange={(e) => setMood(e.target.value)} className="story-select">
            <option value="">Mood</option>
            {moodOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select value={backdrop} onChange={(e) => setBackdrop(e.target.value)} className="story-select">
            <option value="">Scene</option>
            {backdropOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <button className="weave-btn" onClick={generateStory}>
            <AnimatedIcon path={icons.quill} />
            Weave a Tale
          </button>
        </div>
      </div>

      <div className="storybook-content">
        {storyPages.length ? (
          <div className="story-book">
            <div className={`backdrop-overlay ${backdrop}`}></div>
            <h2 className="story-title">{mood} Adventure</h2>
            <div className="book-pages">
              <div className={`page left-page ${currentPage === 0 ? 'active' : ''}`}>
                <div className="page-content">
                  <p>{storyPages[currentPage]}</p>
                </div>
              </div>
              <div className={`page right-page ${isFlipping ? 'flipping' : ''}`}>
                <div className="page-content">
                  {currentPage < storyPages.length - 1 && <p>{storyPages[currentPage + 1]}</p>}
                </div>
              </div>
              <button className="flip-btn prev" onClick={() => flipPage('prev')} disabled={currentPage === 0 || isFlipping}>
                <AnimatedIcon path={icons.star} />
              </button>
              <button className="flip-btn next" onClick={() => flipPage('next')} disabled={currentPage === storyPages.length - 1 || isFlipping}>
                <AnimatedIcon path={icons.star} />
              </button>
              <button className={`favorite-btn ${isFavorited ? 'favorited' : ''}`} onClick={toggleFavorite}>
                <AnimatedIcon path={icons.bookmark} />
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-story">
            <p>Weave a tale to begin your adventure...</p>
          </div>
        )}
      </div>

      <div className="storybook-library">
        <h2 className="library-title">Your Enchanted Library</h2>
        {savedStories.length === 0 ? (
          <div className="story-shelf">
            <p className="library-empty">Bookmark your tales to fill this library!</p>
          </div>
        ) : (
          <div className="story-shelf">
            {savedStories.map((story, index) => (
              <div
                key={index}
                className="story-book"
                onClick={() => {
                  setStoryPages(story.pages);
                  setMood(story.mood);
                  setBackdrop(story.backdrop);
                  setCurrentPage(0);
                  setIsFavorited(true);
                }}
              >
                <div className="book-spine">
                  <span className="spine-title">{story.mood}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveStorytellingApp;