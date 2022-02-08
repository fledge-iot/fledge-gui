import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AclListComponent } from './acl-list.component';

describe('AclListComponent', () => {
  let component: AclListComponent;
  let fixture: ComponentFixture<AclListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AclListComponent ]
    })
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
