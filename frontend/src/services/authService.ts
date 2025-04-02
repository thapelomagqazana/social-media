/**
 * AuthService
 * Handles API calls for auth-related features
 */

import api from "./api";

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export const signUp = async (data: SignUpPayload) => {
  const response = await api.post("/auth/signup", data);
  return response.data;
};

export const signIn = async (data: SignInPayload) => {
  const response = await api.post("/auth/signin", data);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data
};

export const signOut = async () => {
  const response = await api.get("/auth/signout");
  return response.data;
};
