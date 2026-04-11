import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of, forkJoin, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DocumentConstructorService } from '../core/document-constructor.service';
import {
  ConstructorDocument,
  ConstructorDocumentSaveRequest,
  ConstructorPdfRequest,
  ConstructorTemplateDetails,
  ConstructorTemplateField,
  ConstructorTemplateSection,
  ConstructorTemplateSummary,
  ConstructorValidationError
} from '../core/models/document-constructor';
import { UserService } from '../core/user.service';
import { UserResponse } from '../core/models/user';
import { DocumentConstructorRendererService } from './document-constructor-renderer.service';
import { DocumentConstructorPdfService } from './document-constructor-pdf.service';
import { DocumentConstructorPreviewComponent } from './document-constructor-preview.component';

@Component({
  selector: 'app-document-constructor-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DocumentConstructorPreviewComponent],
  templateUrl: './document-constructor-page.component.html',
  styleUrl: './document-constructor-page.component.css'
})
export class DocumentConstructorPageComponent implements OnInit, OnDestroy {
  templates: ConstructorTemplateSummary[] = [];
  documents: ConstructorDocument[] = [];
  selectedTemplate: ConstructorTemplateDetails | null = null;
  selectedDocument: ConstructorDocument | null = null;
  currentUser: UserResponse | null = null;

  form: FormGroup = this.fb.group({});
  previewHtml = '';
  validationErrors: Record<string, string[]> = {};
  statusMessage = '';
  isBusy = false;
  isLoading = true;

  private readonly templateCache = new Map<number, ConstructorTemplateDetails>();
  private formSubscription?: Subscription;

  constructor(
    private readonly fb: FormBuilder,
    private readonly documentConstructorService: DocumentConstructorService,
    private readonly userService: UserService,
    private readonly rendererService: DocumentConstructorRendererService,
    private readonly pdfService: DocumentConstructorPdfService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    forkJoin({
      templates: this.documentConstructorService.getTemplates(),
      documents: this.documentConstructorService.getDocuments().pipe(
        catchError((error) => {
          console.error('[DocumentConstructor] GET /documents failed', error);
          throw error;
        }),
        catchError((error) => {
          console.error('Failed to load saved constructor documents', error);
          this.statusMessage = 'Templates are available, but saved drafts could not be loaded.';
          return of([] as ConstructorDocument[]);
        })
      ),
      currentUser: this.userService.getCurrentUser()
    }).subscribe({
      next: ({ templates, documents, currentUser }) => {
        console.log('[DocumentConstructor] Templates loaded:', templates);
        console.log('[DocumentConstructor] Documents response:', documents);
        console.log('[DocumentConstructor] Current user:', currentUser);

        this.templates = templates;
        this.documents = documents;
        this.currentUser = currentUser;
        this.isLoading = false;

        this.logDocumentsState('after initial load');

        if (templates.length > 0) {
          this.openTemplate(templates[0]);
        }
      },
      error: (error) => {
        console.error('Failed to load constructor data', error);
        this.statusMessage = 'Constructor data could not be loaded.';
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
  }

  openTemplate(templateSummary: ConstructorTemplateSummary): void {
    this.statusMessage = '';
    this.selectedDocument = null;

    const cachedTemplate = this.templateCache.get(templateSummary.id);
    if (cachedTemplate) {
      this.activateTemplate(cachedTemplate);
      return;
    }

    this.documentConstructorService.getTemplate(templateSummary.id).subscribe({
      next: (template) => {
        this.templateCache.set(template.id, template);
        this.activateTemplate(template);
      },
      error: (error) => {
        console.error('Failed to load template', error);
        this.statusMessage = 'Template details could not be loaded.';
      }
    });
  }

  reopenDocument(document: ConstructorDocument): void {
    const cachedTemplate = this.templateCache.get(document.templateId);
    if (cachedTemplate) {
      this.activateTemplate(cachedTemplate, document);
      return;
    }

    this.documentConstructorService.getTemplate(document.templateId).subscribe({
      next: (template) => {
        this.templateCache.set(template.id, template);
        this.activateTemplate(template, document);
      },
      error: (error) => {
        console.error('Failed to reopen constructor document', error);
        this.statusMessage = 'Saved draft could not be reopened.';
      }
    });
  }

  duplicateDocument(document: ConstructorDocument, event?: Event): void {
    event?.stopPropagation();
    this.documentConstructorService.duplicateDocument(document.id).subscribe({
      next: (duplicated) => {
        this.documents = [duplicated, ...this.documents.filter((item) => item.id !== duplicated.id)];
        this.logDocumentsState('after duplicate');
        this.statusMessage = 'Draft duplicated.';
      },
      error: (error) => {
        console.error('Failed to duplicate constructor document', error);
        this.statusMessage = 'Draft duplication failed.';
      }
    });
  }

  saveDraft(): void {
    if (!this.selectedTemplate) {
      return;
    }

    const payload = this.buildSavePayload();
    if (!payload) {
      return;
    }

    this.isBusy = true;
    const request$ = this.selectedDocument
      ? this.documentConstructorService.updateDocument(this.selectedDocument.id, payload)
      : this.documentConstructorService.createDocument(payload);

    request$.subscribe({
      next: (savedDocument) => {
        this.handleSaveSuccess(savedDocument);
      },
      error: (error) => {
        this.handleSaveError(error, payload);
      }
    });
  }

  validate(): void {
    if (!this.selectedTemplate) {
      return;
    }

    this.isBusy = true;
    this.documentConstructorService.validate({
      templateId: this.selectedTemplate.id,
      formData: this.getFormData()
    }).subscribe({
      next: (response) => {
        this.isBusy = false;
        this.previewHtml = response.renderedHtml;
        this.validationErrors = this.toErrorMap(response.errors);
        this.statusMessage = response.valid ? 'Validation passed.' : 'Validation highlighted the fields that still need attention.';
      },
      error: (error) => {
        console.error('Failed to validate constructor draft', error);
        this.isBusy = false;
        this.statusMessage = this.getRequestErrorMessage(error, 'Validation failed.');
      }
    });
  }

  generatePdf(): void {
    if (!this.selectedTemplate) {
      return;
    }

    this.isBusy = true;
    this.documentConstructorService.validate({
      templateId: this.selectedTemplate.id,
      formData: this.getFormData()
    }).subscribe({
      next: (response) => {
        this.isBusy = false;
        this.previewHtml = response.renderedHtml;
        this.validationErrors = this.toErrorMap(response.errors);
        if (!response.valid) {
          this.statusMessage = 'Please fix validation issues before generating the PDF.';
          return;
        }

        const title = String(this.form.get('title')?.value ?? this.selectedTemplate?.name ?? 'Document');
        this.documentConstructorService.generatePdf(this.buildPdfPayload(title)).subscribe({
          next: (pdfResponse) => {
            this.isBusy = false;
            const filename = this.extractFilename(pdfResponse) ?? `${title}.pdf`;
            if (pdfResponse.body) {
              this.pdfService.openPreview(title, response.renderedHtml, pdfResponse.body, filename);
            }
            this.statusMessage = 'PDF preview opened. Download the file from the preview window.';
          },
          error: (error) => {
            console.error('Failed to download PDF', error);
            this.isBusy = false;
            this.statusMessage = this.getRequestErrorMessage(error, 'PDF generation failed.');
          }
        });
        },
        error: (error) => {
          console.error('Failed to generate PDF preview', error);
          this.isBusy = false;
        this.statusMessage = this.getRequestErrorMessage(error, 'PDF generation failed.');
      }
    });
  }

  getVisibleFields(section: ConstructorTemplateSection): ConstructorTemplateField[] {
    const formData = this.form.getRawValue() as Record<string, unknown>;
    return section.fields.filter((field) => this.isVisible(field.visibleWhen, formData));
  }

  hasFieldError(fieldKey: string): boolean {
    return (this.validationErrors[fieldKey] ?? []).length > 0;
  }

  getFieldErrors(fieldKey: string): string[] {
    return this.validationErrors[fieldKey] ?? [];
  }

  trackByTemplate(index: number, template: ConstructorTemplateSummary): number {
    return template.id;
  }

  trackByDocument(index: number, document: ConstructorDocument): number {
    return document.id;
  }

  trackByField(index: number, field: ConstructorTemplateField): string {
    return field.key;
  }

  formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }

  isSelectedTemplate(template: ConstructorTemplateSummary): boolean {
    return this.selectedTemplate?.id === template.id;
  }

  isSelectedDocument(document: ConstructorDocument): boolean {
    return this.selectedDocument?.id === document.id;
  }

  private activateTemplate(template: ConstructorTemplateDetails, document?: ConstructorDocument): void {
    this.selectedTemplate = template;
    this.selectedDocument = document ?? null;
    this.validationErrors = this.toErrorMap(document?.validationErrors ?? []);

    const initialData = document?.formData ?? this.buildPrefillData(template);
    const title = document?.title ?? `${template.name} Draft`;

    this.rebuildForm(template, title, initialData);
    this.previewHtml = document?.renderedHtml ?? this.rendererService.render(template, initialData);
  }

  private rebuildForm(
    template: ConstructorTemplateDetails,
    title: string,
    formData: Record<string, unknown>
  ): void {
    this.formSubscription?.unsubscribe();

    const controls: Record<string, FormControl> = {
      title: new FormControl(title, { nonNullable: true, validators: [Validators.required] })
    };

    for (const section of template.sections) {
      for (const field of section.fields) {
        const initialValue = formData[field.key] ?? this.getInitialValue(field);
        controls[field.key] = new FormControl(initialValue as never, { nonNullable: false });
      }
    }

    this.form = this.fb.group(controls);
    this.formSubscription = this.form.valueChanges.subscribe(() => {
      if (!this.selectedTemplate) {
        return;
      }
      this.previewHtml = this.rendererService.render(this.selectedTemplate, this.getFormData());
    });
  }

  private buildSavePayload(): ConstructorDocumentSaveRequest | null {
    if (!this.selectedTemplate) {
      return null;
    }

    const resolvedTitle = String(this.form.get('title')?.value ?? '').trim() || `${this.selectedTemplate.name} Draft`;
    this.form.get('title')?.setValue(resolvedTitle, { emitEvent: false });

    return {
      templateId: this.selectedTemplate.id,
      title: resolvedTitle,
      formData: this.getFormData()
    };
  }

  private buildPdfPayload(title: string): ConstructorPdfRequest {
    return {
      templateId: this.selectedTemplate!.id,
      title,
      formData: this.getFormData()
    };
  }

  private getFormData(): Record<string, unknown> {
    const rawValue = this.form.getRawValue() as Record<string, unknown>;
    const { title, ...formData } = rawValue;
    return formData;
  }

  private buildPrefillData(template: ConstructorTemplateDetails): Record<string, unknown> {
    const prefill: Record<string, unknown> = {};

    for (const section of template.sections) {
      for (const field of section.fields) {
        prefill[field.key] = this.resolvePrefillValue(field);
      }
    }

    return prefill;
  }

  private resolvePrefillValue(field: ConstructorTemplateField): unknown {
    const key = field.key.toLowerCase();
    const currentDate = new Date().toISOString().slice(0, 10);

    if (field.defaultValue !== undefined) {
      return field.defaultValue;
    }

    if (field.type === 'boolean') {
      return false;
    }

    if (field.type === 'date') {
      return currentDate;
    }

    if (!this.currentUser) {
      return '';
    }

    if (key.includes('company')) {
      return this.currentUser.organization || this.currentUser.fullName || '';
    }
    if (key.includes('signatory') || key.includes('receivername')) {
      return this.currentUser.fullName || '';
    }
    if (key.includes('email')) {
      return this.currentUser.email || '';
    }
    if (key.includes('phone')) {
      return this.currentUser.phone || '';
    }
    if (key.includes('iin') || key.includes('bin')) {
      return this.currentUser.iinBin || '';
    }

    return '';
  }

  private getInitialValue(field: ConstructorTemplateField): unknown {
    if (field.defaultValue !== undefined) {
      return field.defaultValue;
    }
    return field.type === 'boolean' ? false : '';
  }

  private toErrorMap(errors: ConstructorValidationError[]): Record<string, string[]> {
    return errors.reduce<Record<string, string[]>>((accumulator, error) => {
      const existing = accumulator[error.fieldKey] ?? [];
      accumulator[error.fieldKey] = [...existing, error.message];
      return accumulator;
    }, {});
  }

  private isVisible(visibleWhen: string | undefined, formData: Record<string, unknown>): boolean {
    if (!visibleWhen) {
      return true;
    }
    const inverted = visibleWhen.startsWith('!');
    const key = inverted ? visibleWhen.slice(1) : visibleWhen;
    const truthy = formData[key] === true || String(formData[key]).toLowerCase() === 'true';
    return inverted ? !truthy : truthy;
  }

  private getRequestErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse) || !error.error) {
      return fallback;
    }

    if (typeof error.error === 'string') {
      return error.error;
    }

    if (typeof error.error.error === 'string') {
      return error.error.error;
    }

    if (typeof error.error === 'object') {
      const firstMessage = Object.values(error.error).find((value) => typeof value === 'string');
      if (typeof firstMessage === 'string') {
        return firstMessage;
      }
    }

    return fallback;
  }

  private handleSaveSuccess(savedDocument: ConstructorDocument): void {
    this.isBusy = false;
    this.selectedDocument = savedDocument;
    this.previewHtml = savedDocument.renderedHtml;
    this.validationErrors = this.toErrorMap(savedDocument.validationErrors);
    this.documents = [savedDocument, ...this.documents.filter((document) => document.id !== savedDocument.id)];
    console.log('[DocumentConstructor] Save response:', savedDocument);
    this.logDocumentsState('after save');
    this.statusMessage = savedDocument.status === 'VALIDATED'
      ? 'Draft saved and validated.'
      : 'Draft saved. Validation issues still need attention.';
  }

  private handleSaveError(error: unknown, payload: ConstructorDocumentSaveRequest): void {
    console.error('Failed to save constructor draft', error);

    if (this.selectedDocument && this.getRequestErrorMessage(error, '') === 'Document not found') {
      const staleDocumentId = this.selectedDocument.id;
      this.selectedDocument = null;
      this.documents = this.documents.filter((document) => document.id !== staleDocumentId);

      this.createFreshDraft(payload).subscribe({
        next: (savedDocument) => {
          this.handleSaveSuccess(savedDocument);
          this.statusMessage = 'Previous draft reference was stale, so the document was saved as a new draft.';
        },
        error: (createError) => {
          console.error('Failed to create a new draft after stale update reference', createError);
          this.isBusy = false;
          this.statusMessage = this.getRequestErrorMessage(createError, 'Draft could not be saved.');
        }
      });
      return;
    }

    this.isBusy = false;
    this.statusMessage = this.getRequestErrorMessage(error, 'Draft could not be saved.');
  }

  private createFreshDraft(payload: ConstructorDocumentSaveRequest): Observable<ConstructorDocument> {
    return this.documentConstructorService.createDocument(payload);
  }

  private logDocumentsState(context: string): void {
    console.log(`[DocumentConstructor] Documents state ${context}: count=${this.documents.length}`, this.documents);
  }

  private extractFilename(response: { headers?: { get(name: string): string | null } }): string | null {
    const contentDisposition = response.headers?.get('content-disposition');
    if (!contentDisposition) {
      return null;
    }

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1]);
    }

    const plainMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
    return plainMatch?.[1] ?? null;
  }

}
