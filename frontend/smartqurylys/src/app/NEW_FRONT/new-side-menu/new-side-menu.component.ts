import { NgSwitch, NgSwitchCase } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink } from "@angular/router";
import { MyProjectsComponent } from "../../projects/my-projects/my-projects.component";
import { ProjectsPanelComponent } from "../projects-panel/projects-panel.component";

type Panel = 'projects' | 'tasks' | 'contractors' | 'chats' | null

@Component({
  selector: 'app-new-side-menu',
  standalone: true,
  imports: [RouterLink, NgSwitch, NgSwitchCase, MyProjectsComponent, ProjectsPanelComponent],
  templateUrl: './new-side-menu.component.html',
  styleUrl: './new-side-menu.component.css'
})
export class NewSideMenuComponent {
  activePanel: Panel = null;

  togglePanel(panel: Panel) {
    if (this.activePanel === panel) {
      this.activePanel = null;
      return;
    }
    this.activePanel = panel;
  }

  isPanelOpen() {
    return this.activePanel == 'projects' || this.activePanel == 'tasks'
  }
}
