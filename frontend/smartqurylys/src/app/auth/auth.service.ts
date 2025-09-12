import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, ForgotPasswordRequest, PasswordResetRequest, OrganisationRegisterRequest } from '../core/models/auth';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private orgApiUrl = `${environment.apiUrl}/organisations`;

  constructor(private http: HttpClient) { }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => {
        localStorage.setItem('jwt_token', response.token);
      })
    );
  }

  registerOrganisation(request: OrganisationRegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.orgApiUrl}/register`, request).pipe(
      tap(response => {
        localStorage.setItem('jwt_token', response.token);
      })
    );
  }

  uploadRepresentativeDocuments(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.orgApiUrl}/me/files`, formData);
  }

  uploadLicense(file: File, licenseCategoryDisplay: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (licenseCategoryDisplay) {
      formData.append('licenseCategoryDisplay', licenseCategoryDisplay);
    }
    return this.http.post(`${this.orgApiUrl}/me/licenses`, formData);
  }


  login(request: LoginRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/login`, request, { responseType: 'text' }).pipe(
      tap(token => {
        localStorage.setItem('jwt_token', token);
      })
    );
  }

 
  forgotPassword(request: ForgotPasswordRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/forgot-password`, request, { responseType: 'text' });
  }

  resetPassword(request: PasswordResetRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/reset-password`, request, { responseType: 'text' });
  }

  
  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
  }
}
