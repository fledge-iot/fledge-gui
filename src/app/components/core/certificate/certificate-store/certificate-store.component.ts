import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';

import { AlertService, CertificateService, ProgressBarService, RolesService, SharedService } from '../../../../services';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';
import { UploadCertificateComponent } from '../upload-certificate/upload-certificate.component';
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

  // Object to hold data of certificate to delete
  public childData = {
    id: '',
    name: '',
    message: '',
    key: ''
  };

  @ViewChild(AlertDialogComponent, { static: true }) child: AlertDialogComponent;
  @ViewChild(UploadCertificateComponent, { static: true }) uploadModal: UploadCertificateComponent;

  allowDelete = true;
  constructor(private certService: CertificateService,
    public ngProgress: ProgressBarService,
    private alertService: AlertService,
    private sharedService: SharedService,
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

  /**
   * Open delete certificate modal dialog
   * @param cert  name of the cert/key file of the certificate
   * @param message   message to show on alert
   * @param action here action is 'delete'
   */
  openDeleteModal(cert, message, action) {
    this.childData = {
      id: '',
      name: cert,
      message: message,
      key: action
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
  }

  /**
   * Delete Certificate
   * @param certificate  object of certificate, contains name and its type (cert/key)
   */
  deleteCertificate(certificate) {
    /** request started */
    this.ngProgress.start();
    this.certService.deleteCertificate(certificate['name'], certificate['type']).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data['result']);
          this.getCertificates();
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

  /**
   * To reload certificate list after uploading of certificate
   * @param notify
   */
  onNotify() {
    this.getCertificates();
  }

  public ngOnDestroy(): void {
    this.viewPortSubscription.unsubscribe();
  }
}
