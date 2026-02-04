export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  iinBin: string;
  city: string;
  role: string; // Added role property
  userType: string; // Add userType property
}

export interface ChangeEmailRequest {
  newEmail: string;
}

export interface ChangePasswordRequest {

  currentPassword: string;

  newPassword: string;

}



export interface UpdateUserRequest {



  fullName: string;



  phone: string;



  iinBin: string;



  cityId: number;



}








