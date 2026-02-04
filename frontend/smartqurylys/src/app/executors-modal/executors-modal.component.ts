import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../core/task.service';
import { TaskResponse } from '../core/models/task';

@Component({
    selector: 'app-executors-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './executors-modal.component.html',
    styleUrls: ['./executors-modal.component.css']
})
export class ExecutorsModalComponent implements OnInit {
    @Input() stage: any = null;
    @Output() close = new EventEmitter<void>();

    tasks: TaskResponse[] = [];
    isLoading = true;

    constructor(private taskService: TaskService) { }

    ngOnInit() {
        this.loadTasksForStage();
    }

    loadTasksForStage() {
        if (!this.stage) {
            this.isLoading = false;
            return;
        }

        this.taskService.getTasksByStage(this.stage.id).subscribe({
            next: (tasks) => {
                this.tasks = tasks;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading tasks:', err);
                this.isLoading = false;
            }
        });
    }

    closeModal() {
        this.close.emit();
    }

    getUniqueExecutors() {
        const executorsMap = new Map();

        this.tasks.forEach(task => {
            task.responsiblePersons?.forEach(person => {
                if (!executorsMap.has(person.id)) {
                    executorsMap.set(person.id, {
                        ...person,
                        taskNames: [task.name]
                    });
                } else {
                    executorsMap.get(person.id).taskNames.push(task.name);
                }
            });
        });

        return Array.from(executorsMap.values());
    }
}
