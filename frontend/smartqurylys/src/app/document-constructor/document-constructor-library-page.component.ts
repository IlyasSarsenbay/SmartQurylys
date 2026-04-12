import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { DocumentConstructorService } from '../core/document-constructor.service';
import {
  ConstructorDocument,
  ConstructorTemplateSummary
} from '../core/models/document-constructor';

@Component({
  selector: 'app-document-constructor-library-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './document-constructor-library-page.component.html',
  styleUrl: './document-constructor-library-page.component.css'
})
export class DocumentConstructorLibraryPageComponent implements OnInit {
  templates: ConstructorTemplateSummary[] = [];
  documents: ConstructorDocument[] = [];
  statusMessage = '';
  isLoading = true;
  deletingDocumentId: number | null = null;

  constructor(
    private readonly documentConstructorService: DocumentConstructorService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    forkJoin({
      templates: this.documentConstructorService.getTemplates(),
      documents: this.documentConstructorService.getDocuments().pipe(
        catchError((error) => {
          console.error('Failed to load saved constructor documents', error);
          this.statusMessage = 'Шаблоны загружены, но черновики пока недоступны.';
          return of([] as ConstructorDocument[]);
        })
      )
    }).subscribe({
      next: ({ templates, documents }) => {
        this.templates = templates;
        this.documents = documents;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load constructor library', error);
        this.statusMessage = 'Не удалось загрузить библиотеку конструктора.';
        this.isLoading = false;
      }
    });
  }

  openTemplate(template: ConstructorTemplateSummary): void {
    this.router.navigate(['/constructor/editor'], { queryParams: { templateId: template.id } });
  }

  openDocument(document: ConstructorDocument): void {
    this.router.navigate(['/constructor/editor'], { queryParams: { documentId: document.id } });
  }

  duplicateDocument(document: ConstructorDocument, event?: Event): void {
    event?.stopPropagation();
    this.documentConstructorService.duplicateDocument(document.id).subscribe({
      next: (duplicated) => {
        this.documents = [duplicated, ...this.documents.filter((item) => item.id !== duplicated.id)];
        this.statusMessage = 'Черновик продублирован.';
      },
      error: (error) => {
        console.error('Failed to duplicate constructor document', error);
        this.statusMessage = 'Не удалось продублировать черновик.';
      }
    });
  }

  deleteDocument(document: ConstructorDocument, event?: Event): void {
    event?.stopPropagation();

    if (!window.confirm(`Удалить черновик "${document.title}"?`)) {
      return;
    }

    this.deletingDocumentId = document.id;
    this.documentConstructorService.deleteDocument(document.id).subscribe({
      next: () => {
        this.documents = this.documents.filter((item) => item.id !== document.id);
        this.deletingDocumentId = null;
        this.statusMessage = 'Черновик удалён.';
      },
      error: (error) => {
        console.error('Failed to delete constructor document', error);
        this.deletingDocumentId = null;
        this.statusMessage = 'Не удалось удалить черновик.';
      }
    });
  }

  trackByTemplate(index: number, template: ConstructorTemplateSummary): number {
    return template.id;
  }

  trackByDocument(index: number, document: ConstructorDocument): number {
    return document.id;
  }

  formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }
}
