import { HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { AuthService } from "../auth/auth.service";
import { DocumentRequest, DocumentShortResponse } from "./models/document";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})

export class DocumentService {
    private apiUrl = `${environment.apiUrl}/documents`;

    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) { }

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

    getProjectDocuments(projectId: number): Observable<DocumentShortResponse[]> {
        return this.http.get<DocumentShortResponse[]>(`${this.apiUrl}/project/${projectId}`, { headers: this.getAuthHeaders() });
    }

    uploadDocument(request: DocumentRequest, file: File) {
        const formData = new FormData();

        formData.append(
            'request',
            new Blob([JSON.stringify(request)], { type: 'application/json' })
        );

        formData.append('file', file);

        return this.http.post<DocumentShortResponse>(`${this.apiUrl}`, formData, {
            headers: new HttpHeaders({ 'Authorization': `Bearer ${this.authService.getToken()}` })
        });
    }

    downloadDocument(docId: string | number): Observable<HttpResponse<Blob>> {
        return this.http.get(`${this.apiUrl}/download/${docId}`, {
            responseType: 'blob',
            observe: 'response',
            headers: this.getAuthHeaders()
        });
    }

    deleteDocument(docId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${docId}`, { headers: this.getAuthHeaders() });
    }

}