import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserResponse, ChangePasswordRequest, ChangeEmailRequest, UpdateUserRequest } from './models/user';
import { environment } from '../../environments/environment';
import { RegisterRequest } from './models/auth';
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  // General user methods
  getCurrentUser(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/users/me`);
  }

  updateUser(id: number, request: UpdateUserRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/users/${id}`, request);
  }

  updateMyUser(id: number, request: RegisterRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/users/${id}`, request);
  }

  updateCurrentUserProfile(request: RegisterRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/users/me`, request);
  }

  // Admin methods
  getAllUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.apiUrl}/admin/users`);
  }

  getUserById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/admin/users/${id}`);
  }

  getUserRole(id: number): Observable<string> {
    return this.http.get(`${this.apiUrl}/admin/users/${id}/role`, { responseType: 'text' });
  }

  updateUserRole(id: number, role: string): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/admin/users/${id}/role`, role, { headers: { 'Content-Type': 'text/plain' } });
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/users/${id}`);
  }

  changePassword(request: ChangePasswordRequest): Observable<string> {
    return this.http.patch(`${this.apiUrl}/users/change-password`, request, { responseType: 'text' });
  }

  changeEmail(request: ChangeEmailRequest): Observable<string> {
    return this.http.patch(`${this.apiUrl}/users/change-email`, request, { responseType: 'text' });
  }
}