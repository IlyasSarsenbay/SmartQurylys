export type ConstructorFieldType = 'text' | 'textarea' | 'date' | 'money' | 'select' | 'boolean';

export interface ConstructorTemplateSummary {
  id: number;
  code: string;
  name: string;
  category: string;
  description: string;
  version: number;
}

export interface ConstructorTemplateOption {
  value: string;
  label: string;
}

export interface ConstructorTemplateField {
  key: string;
  label: string;
  type: ConstructorFieldType;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  defaultValue?: string | number | boolean;
  visibleWhen?: string;
  options?: ConstructorTemplateOption[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    pattern?: string;
    patternMessage?: string;
  };
}

export interface ConstructorTemplateSection {
  key: string;
  title: string;
  description?: string;
  fields: ConstructorTemplateField[];
}

export interface ConstructorLayoutBlock {
  type: 'heading' | 'subheading' | 'paragraph' | 'list';
  content?: string;
  items?: string[];
  visibleWhen?: string;
}

export interface ConstructorLayoutSection {
  title?: string;
  visibleWhen?: string;
  blocks: ConstructorLayoutBlock[];
}

export interface ConstructorTemplateDetails extends ConstructorTemplateSummary {
  sections: ConstructorTemplateSection[];
  layout: ConstructorLayoutSection[];
}

export interface ConstructorValidationError {
  fieldKey: string;
  message: string;
}

export interface ConstructorValidationResponse {
  valid: boolean;
  renderedHtml: string;
  errors: ConstructorValidationError[];
}

export type ConstructorDocumentStatus = 'DRAFT' | 'VALIDATED';

export interface ConstructorDocument {
  id: number;
  templateId: number;
  templateCode: string;
  templateName: string;
  templateVersion: number;
  title: string;
  status: ConstructorDocumentStatus;
  formData: Record<string, unknown>;
  renderedHtml: string;
  validationErrors: ConstructorValidationError[];
  createdAt: string;
  updatedAt: string;
}

export interface ConstructorDocumentSaveRequest {
  templateId: number;
  title: string;
  formData: Record<string, unknown>;
}

export interface ConstructorValidateRequest {
  templateId: number;
  formData: Record<string, unknown>;
}

export interface ConstructorPdfRequest {
  templateId: number;
  title: string;
  formData: Record<string, unknown>;
}
