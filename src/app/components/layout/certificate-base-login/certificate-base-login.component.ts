import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ProgressBarService, AlertService, AuthService, PingService, UserService } from '../../../services';
import { SharedService } from '../../../services/shared.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-certificate-base-login',
  templateUrl: './certificate-base-login.component.html',
  styleUrls: ['./certificate-base-login.component.css']
})
export class CertificateBaseLoginComponent implements OnInit {
  form: FormGroup;
  isCertificateExt = true;
  certificateFile: any;
  certificateContent: any = '';
  public loginCertButtonText = 'Manually put the certificate content';
  public showBrowseCertificate = true;
  constructor(public ngProgress: ProgressBarService,
    private authService: AuthService,
    private alertService: AlertService,
    private ping: PingService,
    private router: Router,
    private userService: UserService,
    private sharedService: SharedService,
    public formBuilder: FormBuilder) { }

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
      this.loginCertButtonText = 'Browse Certificate';
      this.form.controls.certificate.disable();
    } else {
      this.showBrowseCertificate = true;
      this.loginCertButtonText = 'Manually put the certificate content';
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

  LoginWithCertificate() {
    const certificateTextValue = this.form.get('certificateText').value;
    // If neither the certificate file nor the certificate text value exist, then show error
    if (this.certificateContent.length <= 0 && certificateTextValue.length <= 0) {
      this.alertService.error('Certificate is required');
      return;
    }
    // If certificate text value exists
    if (certificateTextValue !== '') {
      this.certificateContent = certificateTextValue;
    }

    /** request started */
    this.ngProgress.start();
    this.authService.loginWithCertificate(this.certificateContent).
      subscribe(
        (data) => {
          const pingInterval = JSON.parse(localStorage.getItem('PING_INTERVAL'));
          this.ping.pingIntervalChanged.next(pingInterval);
          this.ngProgress.done();
          sessionStorage.setItem('token', data['token']);
          sessionStorage.setItem('uid', data['uid']);
          sessionStorage.setItem('isAdmin', JSON.stringify(data['admin']));
          this.getUser(data['uid']);
          this.router.navigate([''], { replaceUrl: true });
          this.alertService.success(data['message'], true);
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

  onCertificateChange(event: any) {
    this.certificateContent = '';
    if (event.target.files.length !== 0) {
      const fileName = event.target.files[0].name;
      const ext = fileName.substr(fileName.lastIndexOf('.') + 1);
      if (ext !== 'cert') {
        this.isCertificateExt = false;
        return;
      }
      this.isCertificateExt = true;
      if (event.target.files.length > 0) {
        this.readCertificateFileContent(event.target.files[0]);
      }
    }
  }

  getUser(id) {
    // Get SignedIn user details
    this.userService.getUser(id)
      .subscribe(
        (userData) => {
          this.sharedService.isUserLoggedIn.next({
            'loggedIn': true,
            'userName': userData['userName'],
            'isAuthOptional': JSON.parse(sessionStorage.getItem('LOGIN_SKIPPED'))
          });
          sessionStorage.setItem('userName', userData['userName']);
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  protected resetForm() {
    this.form.get('certificate').setValue('');
    this.form.get('certificateText').setValue('');
    this.certificateContent = '';
    this.isCertificateExt = true;
  }
}
