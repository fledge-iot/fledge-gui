import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFilterWizardComponent } from './add-filter-wizard.component';

describe('AddFilterPluginWizardComponent', () => {
  let component: AddFilterWizardComponent;
  let fixture: ComponentFixture<AddFilterWizardComponent>;

  beforeEach(async(() => {
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
