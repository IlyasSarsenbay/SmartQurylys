import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DocumentConstructorPdfService {
  openPreview(title: string, renderedHtml: string, pdfBlob: Blob, filename: string): void {
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const html = this.buildPrintHtml(title, renderedHtml);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, '_blank', 'width=1200,height=900');

    if (!printWindow) {
      URL.revokeObjectURL(blobUrl);
      URL.revokeObjectURL(pdfUrl);
      return;
    }

    printWindow.addEventListener('load', () => {
      const downloadLink = printWindow.document.getElementById('pdf-download-link') as HTMLAnchorElement | null;
      if (downloadLink) {
        downloadLink.href = pdfUrl;
        downloadLink.download = filename;
      }
    }, { once: true });

    printWindow.addEventListener('beforeunload', () => {
      URL.revokeObjectURL(blobUrl);
      URL.revokeObjectURL(pdfUrl);
    }, { once: true });
  }

  private buildPrintHtml(title: string, renderedHtml: string): string {
    return `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${this.escapeHtml(title)}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background: #f5f1e8;
            font-family: "Segoe UI", Arial, sans-serif;
            color: #1f2937;
          }
          .preview-toolbar {
            position: sticky;
            top: 0;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 16px 24px;
            background: rgba(20, 33, 61, 0.96);
            color: #fff;
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18);
          }
          .preview-toolbar__meta {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .preview-toolbar__title {
            font-size: 16px;
            font-weight: 600;
          }
          .preview-toolbar__hint {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.74);
          }
          .preview-toolbar__actions {
            display: flex;
            gap: 12px;
          }
          .preview-toolbar__button {
            border: none;
            border-radius: 999px;
            padding: 10px 16px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
          }
          .preview-toolbar__button--primary {
            background: #f4a261;
            color: #14213d;
          }
          .preview-toolbar__button--secondary {
            background: rgba(255, 255, 255, 0.12);
            color: #fff;
          }
          .preview-shell {
            padding: 32px;
          }
          .print-shell {
            max-width: 900px;
            margin: 0 auto;
            background: #fff;
            padding: 48px 56px;
            box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12);
          }
          .dc-document__header h1,
          .dc-document__section h2,
          .dc-document__section h3 {
            color: #14213d;
          }
          .dc-document__eyebrow {
            letter-spacing: 0.16em;
            text-transform: uppercase;
            font-size: 11px;
            color: #8d6e63;
          }
          .dc-document__section {
            margin-top: 24px;
          }
          .dc-document__section p,
          .dc-document__section li {
            line-height: 1.7;
            font-size: 14px;
          }
          .dc-editable {
            padding: 0 3px;
            border-radius: 4px;
            background: rgba(244, 162, 97, 0.18);
          }
          .dc-editable.is-empty {
            background: rgba(220, 38, 38, 0.1);
            color: #991b1b;
          }
          @media print {
            body {
              background: #fff;
              padding: 0;
            }
            .preview-toolbar {
              display: none;
            }
            .preview-shell {
              padding: 0;
            }
            .print-shell {
              box-shadow: none;
              padding: 0;
              max-width: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="preview-toolbar">
          <div class="preview-toolbar__meta">
            <div class="preview-toolbar__title">${this.escapeHtml(title)}</div>
            <div class="preview-toolbar__hint">Проверьте документ и нажмите "Скачать PDF", чтобы сохранить его через системный PDF-диалог.</div>
          </div>
          <div class="preview-toolbar__actions">
            <button class="preview-toolbar__button preview-toolbar__button--secondary" type="button" onclick="window.close()">Закрыть</button>
            <a id="pdf-download-link" class="preview-toolbar__button preview-toolbar__button--primary" href="#" download>Скачать PDF</a>
          </div>
        </div>
        <div class="preview-shell">
          <div class="print-shell">${renderedHtml}</div>
        </div>
      </body>
      </html>
    `;
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
