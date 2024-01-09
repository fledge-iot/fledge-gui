import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

import { ServicesApiService } from '../../../../services';
import { SharedService } from '../../../../services/shared.service';
import { DialogService } from '../../../common/confirmation-dialog/dialog.service';

@Component({
  selector: "app-manage-services-context-menu",
  templateUrl: "./manage-services-context-menu.component.html",
  styleUrls: ["./manage-services-context-menu.component.css"],
})

export class ManageServicesContextMenuComponent implements OnInit {
    @Input() service;
    @Output() notify: EventEmitter<any> = new EventEmitter<any>();
    public reenableButton = new EventEmitter<boolean>(false);

    constructor(
        public sharedService: SharedService,
        private dialogService: DialogService,
        public servicesApiService: ServicesApiService,
        private router: Router
      ) {}
    
    ngOnInit() {}

    openModal(id: string) {
        this.dialogService.open(id);
    }
    
    closeModal(id: string) {
        this.dialogService.close(id);
    }

    stateUpdate() {
        if (["shutdown", "disabled"].includes(this.service.state)) {
            this.notify.emit({service: this.service.name, state: 'enable'});
        } else {
            this.notify.emit({service: this.service.name, state: 'disable'});
        }
      }

    deleteService() {
        this.notify.emit({service: this.service.name, state: 'delete'});
    }

    viewLogs(name: string) {
        this.router.navigate(['logs/syslog'], { queryParams: { source: name } });
    }
}