export interface SendEmailCodeRequest {
  email: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}