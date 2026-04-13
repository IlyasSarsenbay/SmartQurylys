import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { Participant, ParticipantResponse } from '../../core/models/participant';
import { Project } from '../../core/models/project';
import { ParticipantService } from '../../core/participant.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ProjectService } from '../../core/project.service';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, auditTime, filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectRealtimeService } from '../../core/project-realtime.service';
import { UserService } from '../../core/user.service';


interface ParticipantItem {
  id: number;
  userId: number;
  fullName: string;
  iinBin: string;
  role: string;
  organization: string;
  phone: string;
  email: string;
  canUploadDocuments: boolean;
  canSendNotifications: boolean;
  acceptedInvite: boolean;
  owner: boolean;
}

@Component({
  selector: 'app-project-participants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-participants.component.html',
  styleUrl: './project-participants.component.css'
})
export class ProjectParticipantsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  project!: Project
  participants: ParticipantItem[] = []
  private projectId: number | null = null;
  currentUserIinBin: string | null = null;

  isInviteModalOpen = false;
  isInviting = false;
  inviteIinBinErrorMessage = '';
  inviteRoleErrorMessage = '';
  searchTerm = '';
  openParticipantMenuId: number | null = null;
  participantMenuPosition: { top: number; left: number } | null = null;

  constructor(
    private projectService: ProjectService,
    private participantService: ParticipantService,
    private route: ActivatedRoute,
    private projectRealtimeService: ProjectRealtimeService,
    private userService: UserService
  ) { }
  inviteForm = {
    iinBin: '',
    role: '',
    canUploadDocuments: false,
    canSendNotifications: false
  };

  ngOnInit(): void {
    const id = this.route.parent?.snapshot.paramMap.get('id') ?? this.route.snapshot.paramMap.get('id');
    this.projectId = Number(id);

    this.projectService.activeProject$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((project) => {
        if (project) {
          this.project = project;
        }
      });

    this.loadParticipants(true);

    this.participantService.participantsChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((changedProjectId) => {
      if (this.projectId === null) {
        return;
      }

      if (changedProjectId === null || changedProjectId === this.projectId) {
        this.loadParticipants(true);
      }
    });

    this.projectRealtimeService.events$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((event) => this.projectId !== null && event.projectId === this.projectId),
        filter((event) => event.type.startsWith('PARTICIPANT_') || event.type === 'PROJECT_UPDATED'),
        auditTime(200)
      )
      .subscribe(() => {
        this.loadParticipants(true);
      });

    this.userService.getCurrentUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.currentUserIinBin = user.iinBin;
        },
        error: (error) => {
          console.error('Failed to load current user for participants page:', error);
        }
      });
  }

  get canInviteParticipants(): boolean {
    return !!this.project && !!this.currentUserIinBin && this.project.ownerIinBin === this.currentUserIinBin;
  }

  private loadParticipants(forceRefresh = false): void {
    if (this.projectId === null || !Number.isFinite(this.projectId)) {
      return;
    }

    forkJoin({
      participants: this.participantService.getProjectParticipants(this.projectId, forceRefresh),
      invited: this.participantService.getInvitedParticipantsByProject(this.projectId)
    }).subscribe({
      next: ({ participants, invited }) => {
        const mappedParticipants =
          this.mapParticipantsToParticipantItems(participants, true);

        const mappedInvited =
          this.mapParticipantResponsesToParticipantItems(invited, false);

        this.participants = [...mappedParticipants, ...mappedInvited];
      },
      error: (err) => {
        console.error('Fetch failed:', err);
      }
    });
  }

  get filteredParticipants(): ParticipantItem[] {
    const value = this.searchTerm.toLowerCase().trim();

    if (!value) return this.participants;

    return this.participants.filter((participant) =>
      (participant.fullName ?? '').toLowerCase().includes(value) ||
      (participant.email ?? '').toLowerCase().includes(value) ||
      (participant.iinBin ?? '').toLowerCase().includes(value) ||
      (participant.role ?? '').toLowerCase().includes(value) ||
      (participant.organization ?? '').toLowerCase().includes(value)
    );
  }

  closeInviteModal(): void {
    if (this.isInviting) {
      return;
    }
    this.isInviteModalOpen = false;
    this.resetInviteForm();
  }

  toggleParticipantMenu(participantId: number, event: MouseEvent): void {
    if (this.openParticipantMenuId === participantId) {
      this.closeParticipantMenu();
      return;
    }

    const trigger = event.currentTarget as HTMLElement | null;
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 190;
    const menuHeight = 96;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 12;

    let left = rect.right - menuWidth;
    if (left < margin) {
      left = margin;
    } else if (left + menuWidth > viewportWidth - margin) {
      left = viewportWidth - margin - menuWidth;
    }

    let top = rect.bottom + 6;
    if (top + menuHeight > viewportHeight - margin) {
      top = Math.max(margin, rect.top - menuHeight - 6);
    }

    this.openParticipantMenuId = participantId;
    this.participantMenuPosition = { top, left };
  }

  closeParticipantMenu(): void {
    this.openParticipantMenuId = null;
    this.participantMenuPosition = null;
  }

  removeParticipant(item: ParticipantItem): void {
    if (!this.canInviteParticipants || item.owner) {
      return;
    }

    this.closeParticipantMenu();

    this.participantService.removeParticipant(item.id).subscribe({
      next: () => {
        this.loadParticipants(true);
      },
      error: (error) => {
        console.error('Failed to remove participant:', error);
      }
    });
  }

  cancelInvitation(item: ParticipantItem): void {
    if (!this.canInviteParticipants) {
      return;
    }

    this.closeParticipantMenu();

    this.participantService.cancelInvitation(item.id).subscribe({
      next: () => {
        this.loadParticipants(true);
      },
      error: (error) => {
        console.error('Failed to cancel invitation:', error);
      }
    });
  }

  inviteParticipant(): void {
    if (!this.canInviteParticipants || this.isInviting) {
      return;
    }

    this.clearInviteFieldErrors();
    const normalizedIinBin = this.inviteForm.iinBin.trim();
    const normalizedRole = this.inviteForm.role.trim();

    let hasValidationError = false;

    if (!normalizedIinBin) {
      this.inviteIinBinErrorMessage = 'Заполните ИИН/БИН.';
      hasValidationError = true;
    }

    if (!normalizedRole) {
      this.inviteRoleErrorMessage = 'Заполните роль.';
      hasValidationError = true;
    }

    if (hasValidationError) {
      return;
    }

    this.isInviting = true;

    this.projectService.inviteParticipant(this.project.id, {
      iinBin: normalizedIinBin,
      role: normalizedRole,
      canSendNotifications: this.inviteForm.canSendNotifications,
      canUploadDocuments: this.inviteForm.canUploadDocuments
    })
      .subscribe({
        next: () => {
          this.isInviting = false;
          this.closeInviteModal();
        },
        error: (error: HttpErrorResponse) => {
          this.isInviting = false;
          this.inviteIinBinErrorMessage = this.extractErrorMessage(error, 'Ошибка при отправке приглашения.');
        }
      });
  }

  resetInviteForm(): void {
    this.inviteForm = {
      iinBin: '',
      role: '',
      canUploadDocuments: false,
      canSendNotifications: false
    };
    this.clearInviteFieldErrors();
  }

  onInviteIinBinChange(): void {
    this.inviteIinBinErrorMessage = '';
  }

  onInviteRoleChange(): void {
    this.inviteRoleErrorMessage = '';
  }

  private clearInviteFieldErrors(): void {
    this.inviteIinBinErrorMessage = '';
    this.inviteRoleErrorMessage = '';
  }

  private extractErrorMessage(err: HttpErrorResponse, defaultMessage: string): string {
    if (typeof err.error === 'string' && err.error) {
      return err.error;
    }
    if (err.error && typeof err.error === 'object' && typeof err.error.error === 'string') {
      return err.error.error;
    }
    if (err.error && typeof err.error === 'object' && typeof err.error.message === 'string') {
      return err.error.message;
    }
    return defaultMessage;
  }

  mapParticipantResponseToParticipantItem(
    response: ParticipantResponse,
    acceptedInvite: boolean
  ): ParticipantItem {
    return {
      id: response.id,
      userId: response.userId,
      fullName: response.fullName,
      iinBin: response.iinBin,
      role: response.role,
      organization: response.organization,
      phone: response.phone,
      email: response.email,
      canUploadDocuments: response.canUploadDocuments,
      canSendNotifications: response.canSendNotifications,
      acceptedInvite: acceptedInvite,
      owner: response.owner
    };
  }

  mapParticipantResponsesToParticipantItems(
    responses: ParticipantResponse[],
    acceptedInvite: boolean
  ): ParticipantItem[] {
    return responses.map(response =>
      this.mapParticipantResponseToParticipantItem(response, acceptedInvite)
    );
  }

  mapParticipantToParticipantItem(
    participant: Participant,
    acceptedInvite: boolean
  ): ParticipantItem {
    return {
      id: participant.id,
      userId: participant.userId,
      fullName: participant.fullName,
      iinBin: participant.iinBin,
      role: participant.role,
      organization: participant.organization,
      phone: participant.phone,
      email: participant.email,
      canUploadDocuments: participant.canUploadDocuments,
      canSendNotifications: participant.canSendNotifications,
      acceptedInvite,
      owner: participant.owner
    };
  }

  mapParticipantsToParticipantItems(
    participants: Participant[],
    acceptedInvite: boolean
  ): ParticipantItem[] {
    return participants.map((participant) =>
      this.mapParticipantToParticipantItem(participant, acceptedInvite)
    );
  }
}
