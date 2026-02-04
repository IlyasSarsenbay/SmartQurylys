import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrganisationResponse, OrganisationUpdateRequest, LicenseUpdateRequest } from './models/organisation';
import { OrganisationRegisterRequest } from './models/auth';
import { FileResponse } from './models/file';
import { LicenseResponse } from './models/license';
import { AuthService } from '../auth/auth.service';

// Сервис для работы с данными организаций.
@Injectable({
  providedIn: 'root'
})
export class OrganisationService {
  private apiUrl = `${environment.apiUrl}/organisations`;

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

  private getFileAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    }
    return new HttpHeaders();
  }

  // Создание организации администратором.
  createOrganisation(request: OrganisationRegisterRequest): Observable<OrganisationResponse> {
    return this.http.post<OrganisationResponse>(this.apiUrl, request, { headers: this.getAuthHeaders() });
  }

  // Получение информации о текущей организации пользователя.
  getMyOrganisationInfo(): Observable<OrganisationResponse> {
    return this.http.get<OrganisationResponse>(`${this.apiUrl}/me`, { headers: this.getAuthHeaders() });
  }

  // Получение организации по ID (только для администраторов).
  getOrganisationById(id: number): Observable<OrganisationResponse> {
    return this.http.get<OrganisationResponse>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  // Получение списка всех организаций (только для администраторов).
  getAllOrganisations(): Observable<OrganisationResponse[]> {
    return this.http.get<OrganisationResponse[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  // Обновление данных текущей организации пользователя.
  updateMyOrganisation(request: OrganisationUpdateRequest): Observable<OrganisationResponse> {
    return this.http.put<OrganisationResponse>(`${this.apiUrl}/me`, request, { headers: this.getAuthHeaders() });
  }

  // Обновление организации по ID (только для администраторов).
  updateOrganisation(id: number, request: OrganisationUpdateRequest): Observable<OrganisationResponse> {
    return this.http.put<OrganisationResponse>(`${this.apiUrl}/${id}`, request, { headers: this.getAuthHeaders() });
  }

  // Удаление организации по ID (только для администраторов).
  deleteOrganisation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  // Получение файлов текущей организации.
  getMyOrganisationFiles(): Observable<FileResponse[]> {
    return this.http.get<FileResponse[]>(`${this.apiUrl}/me/files`, { headers: this.getAuthHeaders() });
  }

  // Получение файлов организации по ID (только для администраторов).
  getOrganisationFiles(id: number): Observable<FileResponse[]> {
    return this.http.get<FileResponse[]>(`${this.apiUrl}/${id}/files`, { headers: this.getAuthHeaders() });
  }

  // Загрузка файла для организации по ID (только для администраторов).
  uploadOrganisationFile(id: number, file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<void>(`${this.apiUrl}/${id}/files`, formData, { headers: this.getFileAuthHeaders() });
  }

  // Добавление лицензии для текущей организации.
  addLicenseToMyOrganisation(file: File, licenseCategoryDisplay?: string): Observable<LicenseResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (licenseCategoryDisplay) {
      formData.append('licenseCategoryDisplay', licenseCategoryDisplay);
    }
    return this.http.post<LicenseResponse>(`${this.apiUrl}/me/licenses`, formData, { headers: this.getFileAuthHeaders() });
  }

  // Получение лицензий текущей организации.
  getMyOrganisationLicenses(): Observable<LicenseResponse[]> {
    return this.http.get<LicenseResponse[]>(`${this.apiUrl}/me/licenses`, { headers: this.getAuthHeaders() });
  }

  // Добавление лицензии для организации по ID (только для администраторов).
  addLicenseToOrganisation(organisationId: number, file: File, licenseCategoryDisplay?: string): Observable<LicenseResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (licenseCategoryDisplay) {
      formData.append('licenseCategoryDisplay', licenseCategoryDisplay);
    }
    return this.http.post<LicenseResponse>(`${this.apiUrl}/${organisationId}/licenses`, formData, { headers: this.getFileAuthHeaders() });
  }

  // Получение лицензий организации по ID (для администраторов, непубличный эндпоинт).
  getOrganisationLicensesAdmin(organisationId: number): Observable<LicenseResponse[]> {
    return this.http.get<LicenseResponse[]>(`${this.apiUrl}/${organisationId}/licenses`, { headers: this.getAuthHeaders() });
  }

  // Получение лицензий организации по ID (публичный доступ, например, для реестра подрядчиков).
  getOrganisationLicensesPublic(organisationId: number): Observable<LicenseResponse[]> {
    return this.http.get<LicenseResponse[]>(`${this.apiUrl}/public/licenses/${organisationId}`);
  }


  // Обновление лицензии по ID (только для администраторов).
  updateLicense(id: number, request: LicenseUpdateRequest): Observable<LicenseResponse> {
    return this.http.put<LicenseResponse>(`${this.apiUrl}/licenses/${id}`, request, { headers: this.getAuthHeaders() });
  }

  // Обновление своей лицензии.
  updateMyLicense(id: number, file?: File, name?: string, licenseCategoryDisplay?: string): Observable<LicenseResponse> {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (name) formData.append('name', name);
    if (licenseCategoryDisplay) formData.append('licenseCategoryDisplay', licenseCategoryDisplay);

    return this.http.put<LicenseResponse>(`${this.apiUrl}/me/licenses/${id}`, formData, { headers: this.getFileAuthHeaders() });
  }

  // Получение списка подрядчиков (публичный доступ).
  // getContractors(): Observable<OrganisationResponse[]> {
  //   return this.http.get<OrganisationResponse[]>(`${this.apiUrl}/public/contractors`);
  // }

  // Поиск подрядчиков с использованием фильтров (публичный доступ).
  searchContractors(filters: {
    city?: string;
    specialization?: string;
    minExperience?: number;
    searchTerm?: string;
  }): Observable<OrganisationResponse[]> {
    let params = new HttpParams();

    if (filters.city) params = params.set('city', filters.city);
    if (filters.specialization) params = params.set('specialization', filters.specialization);
    if (filters.minExperience) params = params.set('minExperience', filters.minExperience.toString());
    if (filters.searchTerm) params = params.set('search', filters.searchTerm);

    return this.http.get<OrganisationResponse[]>(`${this.apiUrl}/public/contractors/search`, { params });
  }

  // Альтернативный метод: получение всех организаций и фильтрация на клиенте по типу "Подрядчик".
  getContractorsFromAll(): Observable<OrganisationResponse[]> {
    return new Observable(observer => {
      this.getAllOrganisations().subscribe({
        next: (organisations) => {
          const contractors = organisations.filter(org =>
            org.type === 'Заказчик' || // Adjusted to match the Russian value
            org.type === 'CONTRACTOR' ||
            org.type === 'Подрядчик'
          );
          observer.next(contractors);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  downloadFile(fileId: string | number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${environment.apiUrl}/files/download/${fileId}`, {
      responseType: 'blob',
      observe: 'response',
      headers: this.getAuthHeaders()
    });
  }
}