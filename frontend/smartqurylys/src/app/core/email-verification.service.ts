import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmailVerificationService {

  private apiUrl = `${environment.apiUrl}/email`; 

  constructor(private http: HttpClient) { }

  sendEmailVerificationCode(email: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/send-code`, { email }, { responseType: 'text' });
  }

  verifyEmailVerificationCode(email: string, code: string): Observable<string> {
    
    return this.http.post(`${this.apiUrl}/verify-code`, { email, code }, { responseType: 'text' });
  }
}