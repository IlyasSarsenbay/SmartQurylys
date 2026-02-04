import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../core/project.service';
import { FileResponse } from '../../core/models/file';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.css']
})
export class DocumentsComponent implements OnInit {
  projectId: number;
  files: FileResponse[] = [];
  isLoading = false;
  selectedFile: File | null = null;
  uploadProgress = 0;
  isUploading = false;

  // Навигационные элементы
  navItems = [
    { label: 'Этапы проекта', icon: 'list', view: 'stages', active: false },
    { label: 'Документация', icon: 'document', view: 'documents', active: true },
    { label: 'Направить уведомление', icon: 'notification', view: 'notifications', active: false },
    { label: 'Участники проекта', icon: 'users', view: 'users', active: false },
    { label: 'Чат', icon: 'chat', view: 'chat', active: false },
    { label: 'Проект', icon: 'project', view: 'project', active: false },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService
  ) {
    this.projectId = +this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.loadProjectFiles();
  }

  loadProjectFiles(): void {
    this.isLoading = true;
    this.projectService.getProjectFiles(this.projectId).subscribe({
      next: (files) => {
        this.files = files;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Ошибка при загрузке файлов:', error);
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.uploadProgress = 0;

    this.projectService.uploadProjectFile(this.projectId, this.selectedFile).subscribe({
      next: () => {
        this.uploadProgress = 100;
        setTimeout(() => {
          this.isUploading = false;
          this.selectedFile = null;
          this.uploadProgress = 0;
          this.loadProjectFiles(); // Перезагружаем список файлов
        }, 500);
      },
      error: (error) => {
        console.error('Ошибка при загрузке файла:', error);
        this.isUploading = false;
        this.uploadProgress = 0;
      }
    });
  }

  downloadFile(file: FileResponse): void {
    this.projectService.downloadFile(file.id).subscribe({
      next: (response) => {
        const blob = response.body;
        const contentDisposition = response.headers.get('content-disposition');
        let filename = file.name;

        if (contentDisposition) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        const url = window.URL.createObjectURL(blob!);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Ошибка при скачивании файла:', error);
      }
    });
  }

  deleteFile(fileId: number): void {
    if (confirm('Вы уверены, что хотите удалить этот файл?')) {
      this.projectService.deleteProjectFile(fileId).subscribe({
        next: () => {
          this.files = this.files.filter(f => f.id !== fileId);
        },
        error: (error) => {
          console.error('Ошибка при удалении файла:', error);
        }
      });
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return '🖼️';
      case 'zip':
      case 'rar':
        return '📦';
      default:
        return '📎';
    }
  }

  // Методы для фильтрации файлов по категориям
  getContractFiles(): FileResponse[] {
    return this.files.filter(f => f.name.toLowerCase().includes('договор'));
  }

  getEstimateFiles(): FileResponse[] {
    return this.files.filter(f => f.name.toLowerCase().includes('смет'));
  }

  getReportFiles(): FileResponse[] {
    return this.files.filter(f => f.name.toLowerCase().includes('отчет'));
  }

  getOtherFiles(): FileResponse[] {
    const categorizedFiles = [
      ...this.getContractFiles(),
      ...this.getEstimateFiles(),
      ...this.getReportFiles()
    ];

    return this.files.filter(file =>
      !categorizedFiles.some(catFile => catFile.id === file.id)
    );
  }

  onNavItemClick(item: any): void {
    // Сбрасываем активность у всех элементов
    this.navItems.forEach(navItem => navItem.active = false);

    // Устанавливаем активность текущему элементу
    item.active = true;

    // Обрабатываем навигацию
    if (item.view === 'documents') {
      // Уже на странице документов
      return;
    }

    if (item.view === 'project') {
      this.router.navigate(['/project', this.projectId]);
    } else {
      // Для всех остальных (stages, notifications, users, chat) 
      // переходим на страницу дашборда с параметром вида
      this.router.navigate(['/projects', this.projectId], {
        queryParams: { view: item.view }
      });
    }
  }
}