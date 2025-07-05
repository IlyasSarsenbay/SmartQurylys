import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserResponse, ChangeEmailRequest, ChangePasswordRequest } from './models/user';
import { RegisterRequest } from './models/auth';
import { AuthService } from '../auth/auth.service'; // Import AuthService to get token

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (token) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
    }
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

 
  getCurrentUser(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/me`, { headers: this.getAuthHeaders() });
  }

  updateUser(request: RegisterRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/me`, request, { headers: this.getAuthHeaders() });
  }

  changeEmail(request: ChangeEmailRequest): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.apiUrl}/change-email`, request, { headers: this.getAuthHeaders() });
  }

  changePassword(request: ChangePasswordRequest): Observable<string> {
    return this.http.patch(`${this.apiUrl}/change-password`, request, { responseType: 'text', headers: this.getAuthHeaders() });
  }
}
