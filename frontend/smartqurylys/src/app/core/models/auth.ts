import { UserResponse } from './user';


export interface AuthResponse {
  token: string;
  user: UserResponse;
}


export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  organization: string;
  iinBin: string;
  cityId: number; 
}

export interface OrganisationRegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  iinBin: string;
  cityId: number;
  judAddress: string;
  organization: string;
  position: string;
  type: string;
  field: string;
  specialization: string[];
  yearsOfExperience: number;
}


export interface ForgotPasswordRequest {
  contact: string; 
}

export interface PasswordResetRequest {
  contact: string; 
  code: string;
  newPassword: string;
}