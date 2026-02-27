import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? '/api'
    : 'https://tempra-private-launch-1.onrender.com');

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
