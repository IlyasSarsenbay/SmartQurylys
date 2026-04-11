import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-document-constructor-preview',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="preview-html" [innerHTML]="safeHtml"></div>`,
  styleUrl: './document-constructor-preview.component.css'
})
export class DocumentConstructorPreviewComponent {
  safeHtml: SafeHtml = '';

  constructor(private readonly sanitizer: DomSanitizer) {}

  @Input()
  set html(value: string) {
    this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(value ?? '');
  }
}
