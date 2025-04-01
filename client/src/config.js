// client/src/config.js
const API_URL = process.env.NODE_ENV === 'production'
  ? '' 
  : 'http://localhost:5000'; 

export default API_URL;