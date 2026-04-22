import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️  Change this to your deployed Render URL when deploying!
// For local development use: 'http://10.0.2.2:5000/api'  (Android emulator)
// For real device on same WiFi: 'http://YOUR_LOCAL_IP:5000/api'
const BASE_URL = 'http://192.168.1.8:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Attach JWT token to every request automatically
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
