import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProjectNote {
    id: number;
    projectId: number;
    author: {
        id: number;
        fullName: string;
        email: string;
        iinBin: string;
        role: string;
    };
    content: string;
    createdAt: string;
}

export interface ProjectNoteRequest {
    content: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProjectNoteService {
    private apiUrl = 'http://localhost:8080/api/projects';

    constructor(private http: HttpClient) { }

    getProjectNotes(projectId: number): Observable<ProjectNote[]> {
        return this.http.get<ProjectNote[]>(`${this.apiUrl}/${projectId}/notes`);
    }

    createNote(projectId: number, content: string): Observable<ProjectNote> {
        return this.http.post<ProjectNote>(`${this.apiUrl}/${projectId}/notes`, { content });
    }

    deleteNote(noteId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/notes/${noteId}`);
    }
}
