import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AddFilterWizardComponent } from './add-filter-wizard.component';

describe('AddFilterPluginWizardComponent', () => {
  let component: AddFilterWizardComponent;
  let fixture: ComponentFixture<AddFilterWizardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddFilterWizardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddFilterWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
