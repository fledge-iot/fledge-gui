import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowConfigurationComponent } from './show-configuration.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('ShowConfigurationComponent', () => {
  let component: ShowConfigurationComponent;
  let fixture: ComponentFixture<ShowConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ ShowConfigurationComponent ]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
