import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectPageHeader } from './project-page-header.component';

describe('ProjectPageHeaderComponent', () => {
  let component: ProjectPageHeader;
  let fixture: ComponentFixture<ProjectPageHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectPageHeader]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectPageHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
