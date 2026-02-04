import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SendEmailCodeRequest, VerifyEmailRequest } from './models/email-verification';

@Injectable({
  providedIn: 'root'
})
export class EmailVerificationService {

  private apiUrl = `${environment.apiUrl}/email`; 

  constructor(private http: HttpClient) { }

  sendEmailVerificationCode(request: SendEmailCodeRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/send-code`, request, { responseType: 'text' });
  }

  verifyEmailVerificationCode(request: VerifyEmailRequest): Observable<string> {
    
    return this.http.post(`${this.apiUrl}/verify-code`, request, { responseType: 'text' });
  }
}