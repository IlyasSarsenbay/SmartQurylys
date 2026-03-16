import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDescCardComponent } from './project-desc-card.component';

describe('ProjectDescCardComponent', () => {
  let component: ProjectDescCardComponent;
  let fixture: ComponentFixture<ProjectDescCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDescCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectDescCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
