import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StagesTabComponent } from './stages-tab.component';

describe('StagesTabComponent', () => {
  let component: StagesTabComponent;
  let fixture: ComponentFixture<StagesTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StagesTabComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StagesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
