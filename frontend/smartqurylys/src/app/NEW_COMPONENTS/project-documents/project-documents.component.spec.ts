import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDocumentsComponent } from './project-documents.component';

describe('ProjectDocumentsComponent', () => {
  let component: ProjectDocumentsComponent;
  let fixture: ComponentFixture<ProjectDocumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDocumentsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectDocumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
