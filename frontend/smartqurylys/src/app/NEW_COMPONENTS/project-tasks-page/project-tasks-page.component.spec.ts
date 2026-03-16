import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTasksPageComponent } from './project-tasks-page.component';

describe('ProjectTasksPageComponent', () => {
  let component: ProjectTasksPageComponent;
  let fixture: ComponentFixture<ProjectTasksPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTasksPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectTasksPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
