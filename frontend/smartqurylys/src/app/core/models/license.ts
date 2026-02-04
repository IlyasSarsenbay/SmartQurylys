export interface LicenseResponse {
  id: number;
  name: string;
  filepath: string;
  size: number;
  createdAt: string;
  creatorIinBin: string;
  licenseCategoryDisplay: string;
  reviewStatus: string;
  rejectionReason?: string;
}