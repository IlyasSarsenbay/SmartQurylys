import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractorRegistryComponent } from './contractor-registry.component';

describe('ContractorRegistryComponent', () => {
  let component: ContractorRegistryComponent;
  let fixture: ComponentFixture<ContractorRegistryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractorRegistryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContractorRegistryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
