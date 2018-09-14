import { Component, OnInit, ViewChild } from '@angular/core';
import { CertificateService, AlertService } from '../../../../services/index';
import { NgProgress } from 'ngx-progressbar';
import { UploadCertificateComponent } from '../upload-certificate/upload-certificate.component';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';

@Component({
  selector: 'app-cert-store',
  templateUrl: './certificate-store.component.html',
  styleUrls: ['./certificate-store.component.css']
})
export class CertificateStoreComponent implements OnInit {
  public certificatesData = [];
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

  constructor(private certService: CertificateService, public ngProgress: NgProgress, private alertService: AlertService) { }

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
    /** request started */
    this.ngProgress.start();
    this.certService.getCertificates().
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.certificatesData = data['certificates'];
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

  public getCertificateName(key, cert) {
    if (key) {
      return key.substr(0, key.indexOf('.'));
    }
    if (cert) {
      return cert.substr(0, cert.indexOf('.'));
    }
  }

  /**
   * Open delete certificate modal dialog
   * @param key   name of the key of certificate
   * @param cert  name of the cert file of the certificate
   * @param message   message to show on alert
   * @param action here action is 'delete'
   */
  openDeleteModal(key, cert, message, action) {
    this.certificateName = this.getCertificateName(key, cert);
    this.childData = {
      id: '',
      name: this.certificateName,
      message: message,
      key: action
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
  }

  /**
   * Delete Certificate
   * @param cert_name name of the certificate to delete
   */
  deleteCertificate(cert_name) {
    /** request started */
    this.ngProgress.start();
    this.certService.deleteCertificate(cert_name).
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
