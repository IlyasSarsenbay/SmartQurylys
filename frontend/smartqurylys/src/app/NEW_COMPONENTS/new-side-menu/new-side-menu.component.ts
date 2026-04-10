import { NgSwitch, NgSwitchCase } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink } from "@angular/router";
import { MyProjectsComponent } from "../../projects/my-projects/my-projects.component";
import { ProjectsPanelComponent } from "../projects-panel/projects-panel.component";
import { NotificationsDialogComponent } from "../notifications-dialog/notifications-dialog.component";

type Panel = 'projects' | 'tasks' | 'contractors' | 'chats' | null

@Component({
  selector: 'app-new-side-menu',
  standalone: true,
  imports: [RouterLink, NgSwitch, NgSwitchCase, MyProjectsComponent, ProjectsPanelComponent, NotificationsDialogComponent],
  templateUrl: './new-side-menu.component.html',
  styleUrl: './new-side-menu.component.css'
})
export class NewSideMenuComponent {
  activePanel: Panel = null;
  isNotificationsDialogOpen = false;

  togglePanel(panel: Panel) {
    if (this.activePanel === panel) {
      this.activePanel = null;
      return;
    }
    this.activePanel = panel;
    console.log(panel)
  }

  closePanel() {
    this.activePanel = null;
  }

  openNotificationsDialog() {
    this.activePanel = null;
    this.isNotificationsDialogOpen = true;
  }

  closeNotificationsDialog() {
    this.isNotificationsDialogOpen = false;
  }

  isPanelOpen() {
    return this.activePanel == 'projects' || this.activePanel == 'tasks'
  }
}
