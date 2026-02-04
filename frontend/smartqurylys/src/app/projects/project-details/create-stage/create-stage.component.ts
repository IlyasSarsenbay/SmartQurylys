import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StageService } from '../../../core/stage.service';
import { CreateStageRequest } from '../../../core/models/stage';

@Component({
  selector: 'app-create-stage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-stage.component.html',
  styleUrls: ['./create-stage.component.css']
})
export class CreateStageComponent implements OnInit {
  scheduleId: number | null = null;
  stageForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private stageService: StageService
  ) {
    this.stageForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Получаем scheduleId из параметров маршрута
    this.route.paramMap.subscribe(params => {
      const scheduleId = params.get('scheduleId');
      if (scheduleId) {
        this.scheduleId = +scheduleId;
      }
    });
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    if (this.stageForm.valid && this.scheduleId) {
      const formValue = this.stageForm.value;
      const createStageRequest: CreateStageRequest = {
        name: formValue.name,
        description: formValue.description,
        startDate: formValue.startDate,
        endDate: formValue.endDate
      };

      this.stageService.createStage(this.scheduleId, createStageRequest).subscribe({
        next: () => {
          this.successMessage = 'Этап успешно создан!';
          // Возвращаемся к списку этапов после успешного создания
          this.router.navigate(['/schedules', this.scheduleId, 'stages']);
        },
        error: (err) => {
          console.error('Error creating stage:', err);
          this.errorMessage = 'Ошибка при создании этапа.';
        }
      });
    } else {
      this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
    }
  }

  onCancel(): void {
    // Возвращаемся к списку этапов без сохранения
    this.router.navigate(['/schedules', this.scheduleId, 'stages']);
  }
}
