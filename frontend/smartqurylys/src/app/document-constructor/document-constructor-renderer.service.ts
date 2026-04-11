import { Injectable } from '@angular/core';
import {
  ConstructorLayoutBlock,
  ConstructorTemplateDetails,
  ConstructorTemplateField,
  ConstructorTemplateSection
} from '../core/models/document-constructor';

@Injectable({
  providedIn: 'root'
})
export class DocumentConstructorRendererService {
  render(template: ConstructorTemplateDetails, formData: Record<string, unknown>): string {
    const fieldMap = this.buildFieldMap(template.sections);
    const sectionsHtml = template.layout
      .filter((section) => this.isVisible(section.visibleWhen, formData))
      .map((section) => {
        const title = section.title ? `<h2>${this.escapeHtml(section.title)}</h2>` : '';
        const blocks = section.blocks
          .filter((block) => this.isVisible(block.visibleWhen, formData))
          .map((block) => this.renderBlock(block, formData, fieldMap))
          .join('');
        return `<section class="dc-document__section">${title}${blocks}</section>`;
      })
      .join('');

    return `
      <article class="dc-document">
        <header class="dc-document__header">
          <p class="dc-document__eyebrow">Template-first business document</p>
          <h1>${this.escapeHtml(template.name)}</h1>
        </header>
        ${sectionsHtml}
      </article>
    `;
  }

  private renderBlock(
    block: ConstructorLayoutBlock,
    formData: Record<string, unknown>,
    fieldMap: Map<string, ConstructorTemplateField>
  ): string {
    switch (block.type) {
      case 'heading':
        return `<h1>${this.renderText(block.content ?? '', formData, fieldMap)}</h1>`;
      case 'subheading':
        return `<h3>${this.renderText(block.content ?? '', formData, fieldMap)}</h3>`;
      case 'list':
        return `<ul>${(block.items ?? []).map((item) => `<li>${this.renderText(item, formData, fieldMap)}</li>`).join('')}</ul>`;
      default:
        return `<p>${this.renderText(block.content ?? '', formData, fieldMap)}</p>`;
    }
  }

  private renderText(
    templateText: string,
    formData: Record<string, unknown>,
    fieldMap: Map<string, ConstructorTemplateField>
  ): string {
    return templateText.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (_, fieldKey: string) => {
      const field = fieldMap.get(fieldKey);
      const rawValue = formData[fieldKey];
      const displayValue = this.formatValue(rawValue, field);
      const empty = !displayValue;
      const label = field?.label ?? fieldKey;
      const classes = `dc-editable${empty ? ' is-empty' : ''}`;
      return `<span class="${classes}" data-field="${this.escapeHtml(fieldKey)}">${this.escapeHtml(empty ? `[${label}]` : displayValue)}</span>`;
    }).replace(/\n/g, '<br />');
  }

  private formatValue(rawValue: unknown, field?: ConstructorTemplateField): string {
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return '';
    }

    if (field?.type === 'money') {
      const parsed = Number(String(rawValue).replace(/,/g, ''));
      return Number.isFinite(parsed) ? `${parsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KZT` : String(rawValue);
    }

    if (field?.type === 'boolean') {
      return rawValue ? 'Yes' : 'No';
    }

    return String(rawValue);
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

  private buildFieldMap(sections: ConstructorTemplateSection[]): Map<string, ConstructorTemplateField> {
    const fieldMap = new Map<string, ConstructorTemplateField>();
    for (const section of sections) {
      for (const field of section.fields) {
        fieldMap.set(field.key, field);
      }
    }
    return fieldMap;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
