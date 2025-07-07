import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GprTabComponent } from './gpr-tab.component';

describe('GprTabComponent', () => {
  let component: GprTabComponent;
  let fixture: ComponentFixture<GprTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GprTabComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GprTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
