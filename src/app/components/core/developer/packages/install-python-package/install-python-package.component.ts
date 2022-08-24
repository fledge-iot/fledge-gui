import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService, ProgressBarService } from '../../../../../services';
import { PackageManagerService } from '../../../../../services/package-manager.service';

@Component({
  selector: 'app-install-python-package',
  templateUrl: './install-python-package.component.html',
  styleUrls: ['./install-python-package.component.css']
})
export class InstallPythonPackageComponent implements OnInit {
  installationForm: FormGroup;
  submitted = false;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    public packageManagerService: PackageManagerService) { }

  ngOnInit(): void {
    this.installationForm = this.fb.group({
      package: ['', Validators.required],
      version: ['']
    }
    );
  }

  get installationFormControl() {
    return this.installationForm.controls;
  }

  installPythonPackage() {
    this.submitted = true;
    if (this.installationForm.valid) {
      /** request started */
      this.ngProgress.start();
      this.packageManagerService.InstallPythonPackage(this.installationForm.value)
        .subscribe(
          (data: any) => {
            /** request completed */
            this.ngProgress.done();
            this.alertService.success(data?.message, true);
            this.router.navigate(['developer/python/package/list']);
          },
          error => {
            /** request completed */
            this.ngProgress.done();
            if (error.status === 0) {
              console.log('service down ', error);
            } else {
              this.alertService.error(error.error.message ? error.error.message : error.statusText);
            }
          });
    }
  }
}
