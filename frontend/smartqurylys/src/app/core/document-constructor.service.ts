import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ConstructorDocument,
  ConstructorDocumentSaveRequest,
  ConstructorPdfRequest,
  ConstructorTemplateDetails,
  ConstructorTemplateSummary,
  ConstructorValidateRequest,
  ConstructorValidationResponse
} from './models/document-constructor';

@Injectable({
  providedIn: 'root'
})
export class DocumentConstructorService {
  private readonly apiUrl = `${environment.apiUrl}/document-constructor`;

  constructor(private readonly http: HttpClient) {}

  getTemplates(): Observable<ConstructorTemplateSummary[]> {
    return this.http.get<ConstructorTemplateSummary[]>(`${this.apiUrl}/templates`);
  }

  getTemplate(templateId: number): Observable<ConstructorTemplateDetails> {
    return this.http.get<ConstructorTemplateDetails>(`${this.apiUrl}/templates/${templateId}`);
  }

  getDocuments(): Observable<ConstructorDocument[]> {
    return this.http.get<ConstructorDocument[]>(`${this.apiUrl}/documents`);
  }

  getDocument(documentId: number): Observable<ConstructorDocument> {
    return this.http.get<ConstructorDocument>(`${this.apiUrl}/documents/${documentId}`);
  }

  createDocument(payload: ConstructorDocumentSaveRequest): Observable<ConstructorDocument> {
    return this.http.post<ConstructorDocument>(`${this.apiUrl}/documents`, payload);
  }

  updateDocument(documentId: number, payload: ConstructorDocumentSaveRequest): Observable<ConstructorDocument> {
    return this.http.put<ConstructorDocument>(`${this.apiUrl}/documents/${documentId}`, payload);
  }

  duplicateDocument(documentId: number): Observable<ConstructorDocument> {
    return this.http.post<ConstructorDocument>(`${this.apiUrl}/documents/${documentId}/duplicate`, {});
  }

  validate(payload: ConstructorValidateRequest): Observable<ConstructorValidationResponse> {
    return this.http.post<ConstructorValidationResponse>(`${this.apiUrl}/validate`, payload);
  }

  generatePdf(payload: ConstructorPdfRequest): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.apiUrl}/pdf`, payload, {
      observe: 'response',
      responseType: 'blob'
    });
  }
}
