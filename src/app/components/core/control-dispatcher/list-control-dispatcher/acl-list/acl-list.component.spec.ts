import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AclListComponent } from './acl-list.component';
import { withAppTestDefaults } from '../../../../../testing/app-test-module';

describe('AclListComponent', () => {
  let component: AclListComponent;
  let fixture: ComponentFixture<AclListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ AclListComponent ]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AclListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
