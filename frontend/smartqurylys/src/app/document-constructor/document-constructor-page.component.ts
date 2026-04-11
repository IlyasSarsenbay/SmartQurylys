import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, Subscription, forkJoin } from 'rxjs';
import { DocumentConstructorService } from '../core/document-constructor.service';
import {
  ConstructorDocument,
  ConstructorDocumentSaveRequest,
  ConstructorPdfRequest,
  ConstructorTemplateDetails,
  ConstructorTemplateField,
  ConstructorTemplateSection,
  ConstructorValidationError
} from '../core/models/document-constructor';
import { UserResponse } from '../core/models/user';
import { UserService } from '../core/user.service';
import { DocumentConstructorPdfService } from './document-constructor-pdf.service';
import { DocumentConstructorPreviewComponent } from './document-constructor-preview.component';
import { DocumentConstructorRendererService } from './document-constructor-renderer.service';

@Component({
  selector: 'app-document-constructor-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DocumentConstructorPreviewComponent],
  templateUrl: './document-constructor-page.component.html',
  styleUrl: './document-constructor-page.component.css'
})
export class DocumentConstructorPageComponent implements OnInit, OnDestroy {
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
  private routeSubscription?: Subscription;
  private statusTimeoutId?: number;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly documentConstructorService: DocumentConstructorService,
    private readonly userService: UserService,
    private readonly rendererService: DocumentConstructorRendererService,
    private readonly pdfService: DocumentConstructorPdfService
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.queryParamMap.subscribe((params) => {
      const templateId = this.parseNumericParam(params.get('templateId'));
      const documentId = this.parseNumericParam(params.get('documentId'));
      this.loadEditor(templateId, documentId);
    });
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
    this.clearStatusTimer();
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
      next: (savedDocument) => this.handleSaveSuccess(savedDocument),
      error: (error) => this.handleSaveError(error, payload)
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
        this.showStatus(
          response.valid
            ? 'Проверка пройдена.'
            : 'Проверка подсветила поля, которые ещё требуют внимания.'
        );
      },
      error: (error) => {
        console.error('Failed to validate constructor draft', error);
        this.isBusy = false;
        this.showStatus(this.getRequestErrorMessage(error, 'Не удалось выполнить проверку.'));
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
        this.previewHtml = response.renderedHtml;
        this.validationErrors = this.toErrorMap(response.errors);

        if (!response.valid) {
          this.isBusy = false;
          this.showStatus('Исправьте ошибки валидации перед формированием PDF.');
          return;
        }

        const title = String(this.form.get('title')?.value ?? this.selectedTemplate?.name ?? 'Документ');
        this.documentConstructorService.generatePdf(this.buildPdfPayload(title)).subscribe({
          next: (pdfResponse) => {
            this.isBusy = false;
            const filename = this.extractFilename(pdfResponse) ?? `${title}.pdf`;
            if (pdfResponse.body) {
              this.pdfService.openPreview(title, response.renderedHtml, pdfResponse.body, filename);
            }
            this.showStatus('Предпросмотр PDF открыт. Скачайте файл из нового окна.');
          },
          error: (error) => {
            console.error('Failed to download PDF', error);
            this.isBusy = false;
            this.showStatus(this.getRequestErrorMessage(error, 'Не удалось сформировать PDF.'));
          }
        });
      },
      error: (error) => {
        console.error('Failed to generate PDF preview', error);
        this.isBusy = false;
        this.showStatus(this.getRequestErrorMessage(error, 'Не удалось сформировать PDF.'));
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

  trackByField(index: number, field: ConstructorTemplateField): string {
    return field.key;
  }

  private loadEditor(templateId: number | null, documentId: number | null): void {
    this.isLoading = true;
    this.clearStatus();

    if (!templateId && !documentId) {
      this.selectedTemplate = null;
      this.selectedDocument = null;
      this.previewHtml = '';
      this.validationErrors = {};
      this.isLoading = false;
      this.showStatus('Выберите шаблон или черновик на странице конструктора.');
      return;
    }

    forkJoin({
      currentUser: this.userService.getCurrentUser()
    }).subscribe({
      next: ({ currentUser }) => {
        this.currentUser = currentUser;

        if (documentId) {
          this.loadDocument(documentId);
          return;
        }

        if (templateId) {
          this.loadTemplate(templateId);
        }
      },
      error: (error) => {
        console.error('Failed to load constructor user context', error);
        this.showStatus('Не удалось загрузить данные пользователя для конструктора.');
        this.isLoading = false;
      }
    });
  }

  private loadTemplate(templateId: number): void {
    const cachedTemplate = this.templateCache.get(templateId);
    if (cachedTemplate) {
      this.activateTemplate(cachedTemplate);
      return;
    }

    this.documentConstructorService.getTemplate(templateId).subscribe({
      next: (template) => {
        this.templateCache.set(template.id, template);
        this.activateTemplate(template);
      },
      error: (error) => {
        console.error('Failed to load template', error);
        this.showStatus('Не удалось загрузить шаблон.');
        this.isLoading = false;
      }
    });
  }

  private loadDocument(documentId: number): void {
    this.documentConstructorService.getDocument(documentId).subscribe({
      next: (document) => {
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
            console.error('Failed to load template for saved document', error);
            this.showStatus('Не удалось загрузить шаблон для черновика.');
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Failed to load constructor document', error);
        this.showStatus('Не удалось открыть сохранённый черновик.');
        this.isLoading = false;
      }
    });
  }

  private activateTemplate(template: ConstructorTemplateDetails, document?: ConstructorDocument): void {
    this.selectedTemplate = template;
    this.selectedDocument = document ?? null;
    this.validationErrors = this.toErrorMap(document?.validationErrors ?? []);

    const initialData = document?.formData ?? this.buildPrefillData(template);
    const title = document?.title ?? `${template.name} Draft`;

    this.rebuildForm(template, title, initialData);
    this.previewHtml = document?.renderedHtml ?? this.rendererService.render(template, initialData);
    this.isLoading = false;
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
    this.router.navigate(['/constructor/editor'], { queryParams: { documentId: savedDocument.id } });
    this.showStatus(
      savedDocument.status === 'VALIDATED'
        ? 'Черновик сохранён и проверен.'
        : 'Черновик сохранён. Остались замечания валидации.'
    );
  }

  private handleSaveError(error: unknown, payload: ConstructorDocumentSaveRequest): void {
    console.error('Failed to save constructor draft', error);

    if (this.selectedDocument && this.getRequestErrorMessage(error, '') === 'Document not found') {
      this.selectedDocument = null;

      this.createFreshDraft(payload).subscribe({
        next: (savedDocument) => {
          this.handleSaveSuccess(savedDocument);
          this.showStatus('Старая ссылка на черновик устарела, поэтому документ сохранён как новый.');
        },
        error: (createError) => {
          console.error('Failed to create a new draft after stale update reference', createError);
          this.isBusy = false;
          this.showStatus(this.getRequestErrorMessage(createError, 'Не удалось сохранить черновик.'));
        }
      });
      return;
    }

    this.isBusy = false;
    this.showStatus(this.getRequestErrorMessage(error, 'Не удалось сохранить черновик.'));
  }

  private createFreshDraft(payload: ConstructorDocumentSaveRequest): Observable<ConstructorDocument> {
    return this.documentConstructorService.createDocument(payload);
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

  private parseNumericParam(rawValue: string | null): number | null {
    if (!rawValue) {
      return null;
    }
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private showStatus(message: string, durationMs = 4500): void {
    this.statusMessage = message;
    this.clearStatusTimer();
    this.statusTimeoutId = window.setTimeout(() => {
      this.statusMessage = '';
      this.statusTimeoutId = undefined;
    }, durationMs);
  }

  private clearStatus(): void {
    this.statusMessage = '';
    this.clearStatusTimer();
  }

  private clearStatusTimer(): void {
    if (this.statusTimeoutId !== undefined) {
      window.clearTimeout(this.statusTimeoutId);
      this.statusTimeoutId = undefined;
    }
  }
}
