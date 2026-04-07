import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectPageHeader } from "../project-page-header/project-page-header.component";
import { DocumentService } from '../../core/document.service';
import { ActivatedRoute } from '@angular/router';
import { DocumentRequest, DocumentShortResponse, DocumentStatus } from '../../core/models/document';
import { DocumentStatusLabels } from '../../core/models/document';
import { ProjectService } from '../../core/project.service';

type DocumentType = 'PDF' | 'DOCX' | 'XLSX' | 'IMAGE' | 'OTHER';

interface ProjectDocument {
  id: number;
  name: string;
  type: DocumentType;
  uploadedBy: string;
  uploadedAt: string;
  status: DocumentStatus;
}

@Component({
  selector: 'app-project-documents-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectPageHeader],
  templateUrl: './project-documents.component.html',
  styleUrl: './project-documents.component.css'
})
export class ProjectDocumentsComponent implements OnInit {
  searchTerm = '';
  selectedType = 'ALL';
  selectedStatus = 'ALL';
  projectId!: number
  documents!: ProjectDocument[]
  statusLabels = DocumentStatusLabels

  constructor(
    private documentService: DocumentService,
    private projectService: ProjectService,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id")
    this.projectId = Number(id)
    this.documentService.getProjectDocuments(this.projectId)
      .subscribe((dtos: DocumentShortResponse[]) => {
        this.documents = dtos.map(dto => this.mapToProjectDocument(dto));
      });
  }

  get filteredDocuments(): ProjectDocument[] {
    return this.documents.filter((doc) => {
      const matchesSearch =
        !this.searchTerm ||
        doc.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        doc.uploadedBy.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesType =
        this.selectedType === 'ALL' || doc.type === this.selectedType;

      const matchesStatus =
        this.selectedStatus === 'ALL' || doc.status === this.selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    Array.from(input.files).forEach((file) => {
      const request: DocumentRequest = {
        projectId: this.projectId,
        name: file.name,
        uploadDate: new Date().toISOString(),
        status: DocumentStatus.APPROVAL,
        fileIds: [],                  // optional
        haveToSignParticipantIds: [], // optional
        signedParticipantIds: []      // optional
      };

      this.documentService.uploadDocument(request, file).subscribe({
        next: (response) => {
          console.log('Upload successful:', response);

          const newDocument: ProjectDocument = {
            id: response.id,
            name: response.name,
            type: this.detectFileType(response.name),
            uploadedBy: `${response.uploaderName} (${response.uploaderEmail})`,
            uploadedAt: this.formatDate(new Date(response.uploadDate)),
            status: response.status as DocumentStatus,
          };

          // Add new document to the top of the list
          this.documents = [newDocument, ...this.documents];
        },
        error: (err) => {
          console.error('Upload failed:', err);
        },
        complete: () => {
          console.log('Request completed');
        }
      });
    });

    // Clear input
    input.value = '';
  }

  detectFileType(fileName: string): DocumentType {
    const lower = fileName.toLowerCase();

    if (lower.endsWith('.pdf')) return 'PDF';
    if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'DOCX';
    if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return 'XLSX';
    if (
      lower.endsWith('.png') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.webp')
    ) {
      return 'IMAGE';
    }

    return 'OTHER';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  }

  getFileIcon(type: DocumentType): string {
    switch (type) {
      case 'PDF':
        return '📕';
      case 'DOCX':
        return '📘';
      case 'XLSX':
        return '📗';
      case 'IMAGE':
        return '🖼️';
      default:
        return '📄';
    }
  }

  onDownload(doc: ProjectDocument): void {
    if (!doc.id) return;

    this.documentService.downloadDocument(doc.id)
      .subscribe({
        next: (response) => {
          const blob = response.body;
          if (!blob) return;

          const contentDisposition = response.headers.get('Content-Disposition');
          const fileName = this.extractFileName(contentDisposition) || doc.name || 'downloaded-file';

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');

          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();

          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('File download failed', error);
        }
      });
  }

  private extractFileName(contentDisposition: string | null): string | null {
    if (!contentDisposition) return null;

    // works for: attachment; filename="example.pdf"
    const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i);

    return match ? decodeURIComponent(match[1]) : null;
  }

  onPreview(doc: ProjectDocument): void {
    console.log('Preview:', doc);
  }

  onDelete(docId: number): void {
    this.documentService.deleteDocument(docId)
    .subscribe({
        next: () => {
          this.documents = this.documents.filter(doc => doc.id !== docId);
        },
        error: (error) => {
          console.error('Ошибка при удалении документа:', error);
        }
      });
  }

  trackByDocId(index: number, doc: ProjectDocument): number {
    return doc.id;
  }

  private mapToProjectDocument(dto: DocumentShortResponse): ProjectDocument {
    return {
      id: dto.id,
      name: dto.name,
      type: this.detectFileType(dto.name),
      uploadedBy: `${dto.uploaderName}`,
      uploadedAt: this.formatDate(new Date(dto.uploadDate)),
      status: dto.status
    };
  }

}