export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  iinBin: string;
  city: string; 
}

export interface ChangeEmailRequest {
  newEmail: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}