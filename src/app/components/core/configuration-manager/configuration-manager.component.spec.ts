import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConfigurationManagerComponent } from './configuration-manager.component';

describe('ConfigurationManagerComponent', () => {
  let component: ConfigurationManagerComponent;
  let fixture: ComponentFixture<ConfigurationManagerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigurationManagerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigurationManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
