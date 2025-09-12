import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div class="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto p-6">
        <!-- Заголовок модального окна -->
        <div class="flex justify-between items-center pb-3 border-b border-gray-200">
          <h3 class="text-2xl font-bold text-gray-900">{{ title }}</h3>
          <button (click)="close()" class="text-gray-400 hover:text-gray-600 focus:outline-none">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <!-- Содержимое модального окна передается через ng-content -->
        <div class="py-4">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ModalComponent {
  // @Input() для получения данных из родительского компонента
  @Input() isOpen = false;
  @Input() title = '';

  // @Output() для отправки события родительскому компоненту
  @Output() closeEvent = new EventEmitter<void>();

  /**
   * Закрывает модальное окно, отправляя событие родителю.
   */
  close(): void {
    this.closeEvent.emit();
  }
}