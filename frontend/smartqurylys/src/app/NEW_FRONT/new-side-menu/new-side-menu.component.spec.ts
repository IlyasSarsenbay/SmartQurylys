import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewSideMenuComponent } from './new-side-menu.component';

describe('NewSideMenuComponent', () => {
  let component: NewSideMenuComponent;
  let fixture: ComponentFixture<NewSideMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewSideMenuComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NewSideMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
