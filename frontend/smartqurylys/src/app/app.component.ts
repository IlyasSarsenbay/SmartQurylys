import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NewSideMenuComponent } from './NEW_COMPONENTS/new-side-menu/new-side-menu.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NewSideMenuComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isPanelOpen = false


}
