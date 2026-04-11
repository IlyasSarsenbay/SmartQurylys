import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DocumentConstructorPdfService {
  openPreview(title: string, renderedHtml: string, pdfBlob: Blob, filename: string): void {
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const html = this.buildPreviewHtml(title, renderedHtml);
    const htmlBlob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const htmlUrl = URL.createObjectURL(htmlBlob);
    const previewWindow = window.open(htmlUrl, '_blank', 'width=1200,height=900');

    if (!previewWindow) {
      URL.revokeObjectURL(htmlUrl);
      URL.revokeObjectURL(pdfUrl);
      return;
    }

    previewWindow.addEventListener('load', () => {
      const downloadLink = previewWindow.document.getElementById('pdf-download-link') as HTMLAnchorElement | null;
      if (downloadLink) {
        downloadLink.href = pdfUrl;
        downloadLink.download = filename;
      }
    }, { once: true });

    previewWindow.addEventListener('beforeunload', () => {
      URL.revokeObjectURL(htmlUrl);
      URL.revokeObjectURL(pdfUrl);
    }, { once: true });
  }

  private buildPreviewHtml(title: string, renderedHtml: string): string {
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
            background: #f9fcff;
            font-family: "Segoe UI", Arial, sans-serif;
            color: #1f3547;
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
            background: rgba(255, 255, 255, 0.97);
            color: #24445e;
            border-bottom: 1px solid rgba(207, 226, 241, 0.95);
            box-shadow: 0 10px 24px rgba(37, 99, 235, 0.06);
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
            color: #69839a;
          }
          .preview-toolbar__actions {
            display: flex;
            gap: 12px;
          }
          .preview-toolbar__button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            border: none;
            border-radius: 999px;
            padding: 10px 16px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
          }
          .preview-toolbar__button--primary {
            background: #ffffff;
            color: #24445e;
            box-shadow: inset 0 0 0 1px rgba(186, 213, 234, 0.95);
          }
          .preview-toolbar__button--secondary {
            background: #f8fcff;
            color: #57758f;
            box-shadow: inset 0 0 0 1px rgba(207, 226, 241, 0.95);
          }
          .preview-shell {
            padding: 32px;
          }
          .print-shell {
            max-width: 900px;
            margin: 0 auto;
            background: #ffffff;
            padding: 48px 56px;
            box-shadow: 0 18px 42px rgba(37, 99, 235, 0.06);
          }
          .dc-document {
            color: #172b3d;
          }
          .dc-document__header {
            border-bottom: 1px solid rgba(207, 226, 241, 0.95);
            padding-bottom: 18px;
            margin-bottom: 24px;
          }
          .dc-document__header h1,
          .dc-document__section h2,
          .dc-document__section h3 {
            color: #1f3c53;
          }
          .dc-document__eyebrow {
            margin: 0 0 8px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            font-size: 11px;
            color: #6f8aa1;
          }
          .dc-document__section {
            margin-top: 24px;
          }
          .dc-document__section p,
          .dc-document__section li {
            line-height: 1.7;
            font-size: 14px;
          }
          .dc-document__section ul {
            margin: 0;
            padding-left: 20px;
          }
          .dc-editable {
            display: inline-block;
            padding: 0 3px;
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.96);
            box-shadow: inset 0 0 0 1px rgba(186, 213, 234, 0.92);
          }
          .dc-editable.is-empty {
            background: rgba(255, 245, 245, 0.96);
            color: #991b1b;
            box-shadow: inset 0 0 0 1px rgba(220, 38, 38, 0.18);
          }
          @media print {
            body {
              background: #ffffff;
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
            <div class="preview-toolbar__hint">Проверьте документ и нажмите "Скачать PDF", чтобы сохранить готовый файл.</div>
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
