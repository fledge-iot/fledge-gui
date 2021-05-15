import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BackupRestoreComponent } from './backup-restore.component';

describe('BackupRestoreComponent', () => {
  let component: BackupRestoreComponent;
  let fixture: ComponentFixture<BackupRestoreComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BackupRestoreComponent ]
    })
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
