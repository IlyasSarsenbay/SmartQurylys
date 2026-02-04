import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectNote, ProjectNoteService } from '../core/project-note.service';

@Component({
    selector: 'app-project-notes-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './project-notes-modal.component.html',
    styleUrls: ['./project-notes-modal.component.css']
})
export class ProjectNotesModalComponent implements OnInit {
    @Input() projectId!: number;
    @Input() isOwner: boolean = false;
    @Input() currentUserId!: number;
    @Output() close = new EventEmitter<void>();

    notes: ProjectNote[] = [];
    newNoteContent: string = '';
    isAddingNote: boolean = false;

    constructor(private projectNoteService: ProjectNoteService) { }

    ngOnInit() {
        this.loadNotes();
    }

    loadNotes() {
        this.projectNoteService.getProjectNotes(this.projectId).subscribe({
            next: (notes) => {
                this.notes = notes;
            },
            error: (err) => console.error('Error loading notes:', err)
        });
    }

    toggleAddNote() {
        this.isAddingNote = !this.isAddingNote;
        if (!this.isAddingNote) {
            this.newNoteContent = '';
        }
    }

    addNote() {
        if (!this.newNoteContent.trim()) return;

        this.projectNoteService.createNote(this.projectId, this.newNoteContent).subscribe({
            next: (note) => {
                this.notes.unshift(note);
                this.newNoteContent = '';
                this.isAddingNote = false;
            },
            error: (err) => console.error('Error creating note:', err)
        });
    }

    deleteNote(noteId: number) {
        if (!confirm('Вы уверены, что хотите удалить эту памятку?')) return;

        this.projectNoteService.deleteNote(noteId).subscribe({
            next: () => {
                this.notes = this.notes.filter(n => n.id !== noteId);
            },
            error: (err) => console.error('Error deleting note:', err)
        });
    }

    canDeleteNote(note: ProjectNote): boolean {
        return this.isOwner || note.author.id === this.currentUserId;
    }

    closeModal() {
        this.close.emit();
    }
}
