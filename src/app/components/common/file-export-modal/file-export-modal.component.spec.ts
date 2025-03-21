import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileExportModalComponent } from './file-export-modal.component';

describe('FileExportModalComponent', () => {
  let component: FileExportModalComponent;
  let fixture: ComponentFixture<FileExportModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FileExportModalComponent]
    });
    fixture = TestBed.createComponent(FileExportModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
