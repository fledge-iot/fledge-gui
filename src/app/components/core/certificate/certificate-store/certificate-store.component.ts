import { Component, OnInit, OnDestroy, ViewChild, EventEmitter } from '@angular/core';

import { AlertService, CertificateService, ProgressBarService, RolesService, SharedService } from '../../../../services';
import { UploadCertificateComponent } from '../upload-certificate/upload-certificate.component';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';
import { sortBy } from 'lodash';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cert-store',
  templateUrl: './certificate-store.component.html',
  styleUrls: ['./certificate-store.component.css']
})
export class CertificateStoreComponent implements OnInit, OnDestroy {
  public keys = [];
  public certificates = [];
  public certificateName = '';
  private viewPortSubscription: Subscription;
  viewPort: any = '';
  certName: string = '';

  @ViewChild(UploadCertificateComponent, { static: true }) uploadModal: UploadCertificateComponent;

  allowDelete = true;
  public reenableButton = new EventEmitter<boolean>(false);

  constructor(private certService: CertificateService,
    public ngProgress: ProgressBarService,
    private alertService: AlertService,
    private sharedService: SharedService,
    private dialogService: DialogService,
    public rolesService: RolesService) { }

  ngOnInit() {
    this.sharedService.isAdmin.subscribe(_isAdmin => {
      this.allowDelete = _isAdmin || JSON.parse(sessionStorage.getItem('LOGIN_SKIPPED'));
    });
    this.getCertificates();
    this.viewPortSubscription = this.sharedService.viewport.subscribe(viewport => {
      this.viewPort = viewport;
    });
  }

  /**
  * Open upload certificate modal dialog
  */
  openUploadCertModal() {
    // call child component method to toggle modal
    this.uploadModal.toggleModal(true);
  }

  public getCertificates() {
    this.certificates = [];
    /** request started */
    this.ngProgress.start();
    this.certService.getCertificates().
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.keys = sortBy(data['keys'], function (obj) {
            return obj.split('.')[1] + obj.substr(0, obj.indexOf('.'));
          });
          const certExtensions = ['cert', 'cer', 'crt', 'csr', 'crl', 'pem', 'json', 'p12', 'pfx', 'der'];
          for (let i = 0; i < certExtensions.length; i++) {
            let certificates = [];
            data['certs'].forEach(c => {
              if (c.split('.')[1] === certExtensions[i]) {
                certificates.push(c);
              }
            });
            certificates = sortBy(certificates, function (obj) {
              return obj.substr(0, obj.indexOf('.'));
            });
            this.certificates = this.certificates.concat(certificates);
          }
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

  public getName(nameWithExtension) {
    return nameWithExtension.substr(0, nameWithExtension.indexOf('.'));
  }

  deleteCertificate(type) {
    /** request started */
    this.ngProgress.start();
    this.certService.deleteCertificate(this.certName, type).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.reenableButton.emit(false);
          this.alertService.success(data['result']);
          this.closeModal('delete-'+ type +'-dialog');
          this.getCertificates();
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          this.reenableButton.emit(false);
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  /**
   * To reload certificate list after uploading of certificate
   * @param notify
   */
  onNotify() {
    this.getCertificates();
  }

  openModal(id: string, cert) {  
    this.certName = cert;
    this.dialogService.open(id);
  }

  closeModal(id: string) {
    this.certName = '';
    this.dialogService.close(id);
  }

  public ngOnDestroy(): void {
    this.viewPortSubscription.unsubscribe();
  }
}
