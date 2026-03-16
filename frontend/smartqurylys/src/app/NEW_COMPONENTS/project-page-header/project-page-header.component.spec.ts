import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectPageHeaderComponent } from './project-page-header.component';

describe('ProjectPageHeaderComponent', () => {
  let component: ProjectPageHeaderComponent;
  let fixture: ComponentFixture<ProjectPageHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectPageHeaderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectPageHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
