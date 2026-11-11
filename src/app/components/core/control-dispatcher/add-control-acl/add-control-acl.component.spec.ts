import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddControlAclComponent } from './add-control-acl.component';
import { withAppTestDefaults } from '../../../../testing/app-test-module';

describe('AddControlAclComponent', () => {
  let component: AddControlAclComponent;
  let fixture: ComponentFixture<AddControlAclComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ AddControlAclComponent ]
    }))
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddControlAclComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
