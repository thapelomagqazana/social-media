/**
 * Axios API instance
 * Automatically sends credentials (cookies) with each request
 */

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Automatically sends cookies (including HTTP-only JWTs)
});

export default api;
