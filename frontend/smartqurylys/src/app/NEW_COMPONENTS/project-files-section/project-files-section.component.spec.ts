import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectFilesSectionComponent } from './project-files-section.component';

describe('ProjectFilesSectionComponent', () => {
  let component: ProjectFilesSectionComponent;
  let fixture: ComponentFixture<ProjectFilesSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectFilesSectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectFilesSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
