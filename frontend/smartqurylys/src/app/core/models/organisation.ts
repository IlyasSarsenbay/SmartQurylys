import { LicenseResponse } from './license';
import { UserResponse } from './user'; // Import UserResponse

export interface OrganisationResponse extends UserResponse { // Extend UserResponse
  judAddress: string;
  organization: string;
  position: string;
  type: string;
  field: string;
  specialization: string[];
  yearsOfExperience: number;
  licenses?: LicenseResponse[];
  status?: 'AVAILABLE' | 'BUSY';
}

export interface OrganisationUpdateRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  iinBin?: string;
  cityId?: number;
  judAddress?: string;
  organization?: string;
  position?: string;
  type?: string;
  field?: string;
  specialization?: string[];
  yearsOfExperience?: number;
  status?: 'AVAILABLE' | 'BUSY';
}

export interface LicenseUpdateRequest {
  name?: string;
  licenseCategoryDisplay?: string;
  reviewStatus?: string;
  rejectionReason?: string;
}
