import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectParticipantsComponent } from './project-participants.component';

describe('ProjectParticipantsComponent', () => {
  let component: ProjectParticipantsComponent;
  let fixture: ComponentFixture<ProjectParticipantsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectParticipantsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectParticipantsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
