import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AddPipelineFilterComponent } from './add-pipeline-filter.component';
import { withAppTestDefaults } from '../../../../../testing/app-test-module';

describe('AddPipelineFilterComponent', () => {
  let component: AddPipelineFilterComponent;
  let fixture: ComponentFixture<AddPipelineFilterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ AddPipelineFilterComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddPipelineFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
