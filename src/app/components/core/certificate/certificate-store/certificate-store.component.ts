import { Component, OnInit, ViewChild } from '@angular/core';

import { AlertService, CertificateService, ProgressBarService } from '../../../../services';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';
import { UploadCertificateComponent } from '../upload-certificate/upload-certificate.component';
import { sortBy } from 'lodash';

@Component({
  selector: 'app-cert-store',
  templateUrl: './certificate-store.component.html',
  styleUrls: ['./certificate-store.component.css']
})
export class CertificateStoreComponent implements OnInit {
  public keys = [];
  public certificates = [];
  public certificateName = '';

  // Object to hold data of certificate to delete
  public childData = {
    id: '',
    name: '',
    message: '',
    key: ''
  };

  @ViewChild(AlertDialogComponent) child: AlertDialogComponent;
  @ViewChild(UploadCertificateComponent) uploadModal: UploadCertificateComponent;

  constructor(private certService: CertificateService,
    public ngProgress: ProgressBarService,
    private alertService: AlertService) { }

  ngOnInit() {
    this.getCertificates();
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
          const certExtensions = ['cert', 'pem', 'json'];
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
}
