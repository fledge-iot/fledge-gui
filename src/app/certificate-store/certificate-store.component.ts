import { Component, OnInit } from '@angular/core';
import { CertificateService, AlertService } from '../services/index';
import { NgProgress } from 'ngx-progressbar';

@Component({
  selector: 'cert-store',
  templateUrl: './certificate-store.component.html',
  styleUrls: ['./certificate-store.component.css']
})
export class CertificateStoreComponent implements OnInit {
  

  constructor(private certService: CertificateService, public ngProgress: NgProgress) { }

  ngOnInit() {}
}
