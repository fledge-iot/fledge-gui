import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

import { ServicesApiService, RolesService } from '../../../../../services';
import { DialogService } from '../../../../common/confirmation-dialog/dialog.service';

@Component({
  selector: "app-additional-services-context-menu",
  templateUrl: "./additional-services-context-menu.component.html",
  styleUrls: ["./additional-services-context-menu.component.css"],
})

export class AdditionalServicesContextMenuComponent implements OnInit {
    @Input() service;
    @Input() index;
    @Output() notify: EventEmitter<any> = new EventEmitter<any>();

    constructor(
        public rolesService: RolesService,
        private dialogService: DialogService,
        public servicesApiService: ServicesApiService,
        private router: Router
      ) {}
    
    ngOnInit() { }

    openModal(id: string) {
        this.dialogService.open(id);
    }
    
    closeModal(id: string) {
        this.dialogService.close(id);
    }

    viewLogs(name: string) {
        this.router.navigate(['logs/syslog'], { queryParams: { source: name } });
    }
}