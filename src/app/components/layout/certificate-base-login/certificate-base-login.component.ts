import { Component, OnInit, HostListener } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ProgressBarService, AlertService, AuthService, PingService, UserService } from '../../../services';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-certificate-base-login',
  templateUrl: './certificate-base-login.component.html',
  styleUrls: ['./certificate-base-login.component.css']
})
export class CertificateBaseLoginComponent implements OnInit {
  form: UntypedFormGroup;
  isCertificateExtensionValid = true;
  certificateFile: File | null = null;
  certificateContent: string = '';
  public showBrowseCertificate = true;

  public get loginCertButtonText(): string {
    return this.showBrowseCertificate ? 'Paste Content' : 'Upload File';
  }
  constructor(public ngProgress: ProgressBarService,
    private authService: AuthService,
    private alertService: AlertService,
    private ping: PingService,
    private router: Router,
    private userService: UserService,
    public formBuilder: UntypedFormBuilder) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      certificate: '',
      certificateText: ''
    });
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.toggleModal(false);
  }

  public toggleModal(isOpen: Boolean) {
    this.resetForm();
    const certificate_modal = <HTMLDivElement>document.getElementById('certificate-login-modal');
    if (isOpen) {
      certificate_modal.classList.add('is-active');
      return;
    }
    certificate_modal.classList.remove('is-active');
  }

  selectOptionOfCertificateLogin() {
    this.resetForm();
    if (this.showBrowseCertificate) {
      this.showBrowseCertificate = false;
      this.form.controls.certificate.disable();
    } else {
      this.showBrowseCertificate = true;
      this.form.controls.certificate.enable();
    }
  }

  readCertificateFileContent(file: any) {
    const fileReader = new FileReader();
    fileReader.readAsText(file);
    fileReader.onload = () => {
      this.certificateContent = fileReader.result;
    };
  }

  loginWithCertificate() {
    const certificate: string = this.form.get('certificateText').value;
    // If neither the certificate file nor the certificate text value exist, then show error
    if (this.certificateContent.length <= 0 && certificate.length <= 0) {
      this.alertService.error('Certificate is required');
      return;
    }
    // If certificate text value exists
    if (certificate !== '') {
      this.certificateContent = certificate;
    }

    /** request started */
    this.ngProgress.start();
    this.authService.loginWithCertificate(this.certificateContent)
      .pipe(switchMap((data) => {
        this.userService.setUserSession(data);
        return this.userService.getUser((data['uid']));
      })).
      subscribe(
        (user) => {
          this.ngProgress.done();
          const pingInterval = JSON.parse(localStorage.getItem('PING_INTERVAL'));
          this.ping.pingIntervalChanged.next(pingInterval);
          this.userService.emitUser(user);
          this.router.navigate([''], { replaceUrl: true });
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  onCertificateChange(event: Event) {
    this.certificateContent = '';
    const input = event.target as HTMLInputElement;
    if (input?.files && input.files.length !== 0) {
      const file = input.files[0];
      const fileName = file.name;
      const ext = fileName.substr(fileName.lastIndexOf('.') + 1);
      if (ext !== 'cert') {
        this.isCertificateExtensionValid = false;
        return;
      }
      this.isCertificateExtensionValid = true;
      this.certificateFile = file;
      this.readCertificateFileContent(file);
    }
  }

  protected resetForm() {
    this.form.get('certificate').setValue('');
    this.form.get('certificateText').setValue('');
    this.certificateContent = '';
    this.isCertificateExtensionValid = true;
  }
}
