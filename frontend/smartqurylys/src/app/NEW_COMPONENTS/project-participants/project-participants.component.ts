import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Participant, ParticipantResponse } from '../../core/models/participant';
import { Project } from '../../core/models/project';
import { ParticipantService } from '../../core/participant.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProjectPageHeader } from "../project-page-header/project-page-header.component";
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
}

@Component({
  selector: 'app-project-participants',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectPageHeader],
  templateUrl: './project-participants.component.html',
  styleUrl: './project-participants.component.css'
})
export class ProjectParticipantsComponent implements OnInit {
  project!: Project
  participants: ParticipantItem[] = []
  invitedParticipants: ParticipantItem[] = []

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
    const id = this.route.snapshot.paramMap.get('id')
    this.projectService.getProjectById(Number(id))
      .subscribe(value => {
        this.project = value
      })

    forkJoin({
      participants: this.participantService.getParticipantsByProject(Number(id)),
      invited: this.participantService.getInvitedParticipantsByProject(Number(id))
    }).subscribe({
      next: ({ participants, invited }) => {
        const mappedParticipants =
          this.mapParticipantResponsesToParticipantItems(participants, true);

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
      acceptedInvite: acceptedInvite
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
}
