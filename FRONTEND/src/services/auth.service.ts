// FRONTEND/src/services/auth.service.ts
import axios from 'axios';
import { UserCreate, AuthResponse } from '../types';

const API_URL = 'http://localhost:8000/api/v1/auth';

// REGISTRO: Envía datos a Python y recibe Token
export const registerUser = async (userData: UserCreate): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/register`, userData);
  return response.data;
};

// LOGIN: Envía credenciales y recibe Token
export const loginUser = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/login`, credentials);
  return response.data;
};