import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { RolesService } from '../../../../services';

@Component({
  selector: 'app-dispatcher-service-config',
  templateUrl: './dispatcher-service-config.component.html',
  styleUrls: ['./dispatcher-service-config.component.css']
})
export class DispatcherServiceConfigComponent implements OnInit {
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
