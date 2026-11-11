import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BackupRestoreComponent } from './backup-restore.component';
import { withAppTestDefaults } from '../../../testing/app-test-module';

describe('BackupRestoreComponent', () => {
  let component: BackupRestoreComponent;
  let fixture: ComponentFixture<BackupRestoreComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(withAppTestDefaults({
      declarations: [ BackupRestoreComponent ]
    }))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackupRestoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
