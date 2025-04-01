const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://companio-rho.vercel.app'
  : 'http://localhost:5000';
export default API_URL;