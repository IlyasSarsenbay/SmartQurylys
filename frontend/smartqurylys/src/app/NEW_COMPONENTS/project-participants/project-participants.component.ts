import { Component, OnInit } from '@angular/core';
import { Participant, ParticipantResponse } from '../../core/models/participant';
import { Project } from '../../core/models/project';
import { ParticipantService } from '../../core/participant.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../core/project.service';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';


interface ParticipantItem {
  id: number;
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
  project!: Project
  participants: ParticipantItem[] = []
  private projectId: number | null = null;

  isInviteModalOpen = false;
  searchTerm = '';

  constructor(
    private projectService: ProjectService,
    private participantService: ParticipantService,
    private route: ActivatedRoute,
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
      .subscribe((project) => {
        if (project) {
          this.project = project;
        }
      });

    this.loadParticipants(true);

    this.participantService.participantsChanged$.subscribe((changedProjectId) => {
      if (this.projectId === null) {
        return;
      }

      if (changedProjectId === null || changedProjectId === this.projectId) {
        this.loadParticipants(true);
      }
    });
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
    this.isInviteModalOpen = false;
    this.resetInviteForm();
  }

  inviteParticipant(): void {
    this.projectService.inviteParticipant(this.project.id, {
      iinBin: this.inviteForm.iinBin,
      role: this.inviteForm.role,
      canSendNotifications: this.inviteForm.canSendNotifications,
      canUploadDocuments: this.inviteForm.canUploadDocuments
    })
      .subscribe()

    this.closeInviteModal();
  }

  resetInviteForm(): void {
    this.inviteForm = {
      iinBin: '',
      role: '',
      canUploadDocuments: false,
      canSendNotifications: false
    };
  }

  mapParticipantResponseToParticipantItem(
    response: ParticipantResponse,
    acceptedInvite: boolean
  ): ParticipantItem {
    return {
      id: response.id,
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
