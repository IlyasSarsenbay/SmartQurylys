import { ChangeDetectorRef, Component, Input, NgZone, OnInit } from '@angular/core';
import { ProjectService } from '../../core/project.service';
import { ActivatedRoute } from '@angular/router';
import { FileResponse } from '../../core/models/file';
import { map } from 'rxjs';

interface FileItem {
  id: number;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
  preview?: string | null;
}

@Component({
  selector: 'app-project-files-section',
  standalone: true,
  imports: [],
  templateUrl: './project-files-section.component.html',
  styleUrl: './project-files-section.component.css'
})
export class ProjectFilesSectionComponent implements OnInit {
  files: FileItem[] = []
  projectId!: number
  openedFileItemMenuId: number | null = null

  constructor(
    private projectService: ProjectService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    const projectId = Number(this.route.snapshot.paramMap.get("id"))
    this.projectId = projectId
    this.projectService.getProjectFiles(projectId)
      .pipe(map((responses) => this.mapFileResponsesToFileItems(responses)))
      .subscribe({
        next: (response) => {
          this.files = response
          console.log('Project files fetched:', response);
        },
        error: (err) => {
          console.error('Files fetch failed:', err);
        },
        complete: () => {
          console.log('Get Files Request completed');
        }
      });
  }

  mapFileResponseToFileItem(fileResponse: FileResponse): FileItem {
    return {
      id: fileResponse.id,
      name: fileResponse.name,
      type: this.getFileType(fileResponse.name),
      uploadDate: this.formatDate(new Date(fileResponse.createdAt)),
      size: this.formatFileSize(fileResponse.size),
      preview: null,
    }
  }

  mapFileResponsesToFileItems(
    responses: FileResponse[]
  ): FileItem[] {
    return responses.map((response) => this.mapFileResponseToFileItem(response));
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    Array.from(input.files).forEach((file) => {
      this.projectService.uploadProjectFile(this.projectId, file).subscribe({
        next: (response) => {
          console.log('Success response:', response);
          const fileId = response.id
        
          const fileItem: FileItem = {
            id: fileId,
            name: file.name,
            type: this.getFileType(file.name),
            uploadDate: this.formatDate(new Date()),
            size: this.formatFileSize(file.size),
            preview: null
          };

          
          this.files = [...this.files, fileItem];
          this.cdr.detectChanges()
        },
        error: (err) => {
          console.error('Upload failed:', err);
        },
        complete: () => {
          console.log('Request completed');
        }
      });

    });

    input.value = '';
  }

  downloadFile(file: FileItem) {
    if (!file.id) return;

    this.projectService.downloadFile(file.id)
      .subscribe({
        next: (response) => {
          const blob = response.body;
          if (!blob) return;

          const contentDisposition = response.headers.get('Content-Disposition');
          const fileName = this.extractFileName(contentDisposition) || file.name || 'downloaded-file';

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');

          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();

          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          this.openedFileItemMenuId = null;
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

  removeFile(fileToRemove: FileItem): void {
    this.projectService.deleteProjectFile(fileToRemove.id)
      .subscribe({
        next: () => {
          this.files = this.files.filter(file => file !== fileToRemove);
        },
        error: (error) => {
          console.error('Ошибка при удалении файла:', error);
        }
      });
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop();
    return extension ? extension.toUpperCase() : 'FILE';
  }

  private formatDate(date: Date): string {
    const months = [
      'янв', 'фев', 'мар', 'апр', 'май', 'июн',
      'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day} ${month}, ${hours}:${minutes}`;
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} байт`;

    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1).replace('.', ',')} КБ`;

    const mb = kb / 1024;
    return `${mb.toFixed(1).replace('.', ',')} МБ`;
  }

  toggleFileItemMenu(id: number) {
    if (this.openedFileItemMenuId == id) {
      this.openedFileItemMenuId = -1;
      return;
    }
    this.openedFileItemMenuId = id;
  }
}
