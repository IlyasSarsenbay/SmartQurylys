import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-reactivation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal *ngIf="isOpen" [isOpen]="isOpen" (closeEvent)="onClose()" title="Возврат этапа в актив">
      <div class="p-6">
        <h2 class="text-xl font-bold mb-4">Возврат этапа в актив</h2>
        <p class="text-gray-600 mb-4">
          Укажите причину возврата этапа <strong>{{ stageName }}</strong> в активное состояние. 
          Это уведомление будет отправлено всем участникам проекта.
        </p>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Причина</label>
          <textarea
            [(ngModel)]="reason"
            class="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-height-[100px]"
            placeholder="Введите причину..."
            rows="4"
          ></textarea>
        </div>

        <div class="flex justify-end gap-3">
          <button
            (click)="onClose()"
            class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Отмена
          </button>
          <button
            (click)="onSubmit()"
            [disabled]="!reason.trim()"
            class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Подтвердить
          </button>
        </div>
      </div>
    </app-modal>
  `
})
export class ReactivationModalComponent {
  @Input() isOpen = false;
  @Input() stageName = '';
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<string>();

  reason = '';

  onClose() {
    this.reason = '';
    this.close.emit();
  }

  onSubmit() {
    if (this.reason.trim()) {
      this.submit.emit(this.reason);
      this.reason = '';
    }
  }
}
