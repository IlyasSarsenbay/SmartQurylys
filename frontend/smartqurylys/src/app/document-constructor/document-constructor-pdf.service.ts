import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DocumentConstructorPdfService {
  openPrintPreview(title: string, renderedHtml: string): void {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');
    if (!printWindow) {
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${this.escapeHtml(title)}</title>
        <style>
          body {
            margin: 0;
            padding: 32px;
            background: #f5f1e8;
            font-family: "Segoe UI", Arial, sans-serif;
            color: #1f2937;
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
            .print-shell {
              box-shadow: none;
              padding: 0;
              max-width: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-shell">${renderedHtml}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
