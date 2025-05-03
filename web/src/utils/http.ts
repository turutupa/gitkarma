import axios from 'axios';

// Helper function to create a delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const http = axios.create({
  baseURL: '/api/proxy',
  // ...other config...
});

// Add request interceptor to simulate delay
http.interceptors.request.use(async (config) => {
  // Only add delay in development
  if (process.env.NODE_ENV === 'development') {
    await delay(500);
  }
  return config;
});
