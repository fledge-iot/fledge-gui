import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { RolesService } from '../../../../services';

@Component({
  selector: 'app-notification-service-config',
  templateUrl: './notification-service-config.component.html',
  styleUrls: ['./notification-service-config.component.css']
})
export class NotificationServiceConfigComponent implements OnInit {
    @Output() serviceConfigureModal = new EventEmitter<boolean>();

    constructor(
        public rolesService: RolesService) {}

    ngOnInit(): void {
    }

    /**
     * Open Configure Service modal
     */
    openConfigureModal() {
        this.serviceConfigureModal.emit(true);
    }
}
