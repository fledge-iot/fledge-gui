import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConfigChildrenComponent } from './config-children.component';

describe('ConfigChildrenComponent', () => {
  let component: ConfigChildrenComponent;
  let fixture: ComponentFixture<ConfigChildrenComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigChildrenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigChildrenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
