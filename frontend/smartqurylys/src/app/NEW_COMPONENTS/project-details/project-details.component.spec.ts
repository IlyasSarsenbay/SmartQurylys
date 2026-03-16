import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewProjectDetailsComponent } from './new-project-details.component';

describe('ProjectDetailsComponent', () => {
  let component: NewProjectDetailsComponent;
  let fixture: ComponentFixture<NewProjectDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewProjectDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NewProjectDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
