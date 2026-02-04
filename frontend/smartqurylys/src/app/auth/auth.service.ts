import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, ForgotPasswordRequest, PasswordResetRequest, OrganisationRegisterRequest } from '../core/models/auth';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode'; // Corrected import for jwt-decode

// Helper interface for the decoded JWT token payload
interface DecodedToken {
  sub: string; // Subject (username)
  roles: string[]; // Roles array
  exp: number; // Expiration time
  iat: number; // Issued at time
  // Add other properties if your token contains them
}

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
    const token = this.getToken();
    if (!token) {
      // console.log('isAuthenticated: No token found.'); // Removed log
      return false;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000; // Convert to seconds
      const isValid = decoded.exp > currentTime;
      // console.log('isAuthenticated: Token decoded, expires in (s):', decoded.exp - currentTime, 'Valid:', isValid); // Removed log
      return isValid;
    } catch (error) {
      console.error('isAuthenticated: Error decoding token:', error);
      return false;
    }
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) {
      // console.log('getUserRole: No token found.'); // Removed log
      return null;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      // console.log('getUserRole: Decoded token:', decoded); // Removed log
      // Assuming 'roles' is an array of strings like ['ROLE_USER', 'ROLE_ADMIN']
      // We return the first role or null if not found
      const role = decoded.roles && decoded.roles.length > 0 ? decoded.roles[0] : null;
      // console.log('getUserRole: Extracted role:', role); // Removed log
      return role;
    } catch (error) {
      console.error('getUserRole: Error decoding token:', error);
      return null;
    }
  }

  getUserId(): number | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const decoded = jwtDecode<any>(token);
      return decoded.id || decoded.userId || null;
    } catch (error) {
      return null;
    }
  }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/users/me`);
  }

  logout(): void {
    // console.log('Logging out...'); // Removed log
    localStorage.removeItem('jwt_token');
  }
}
