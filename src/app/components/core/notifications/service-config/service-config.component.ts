import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { RolesService } from '../../../../services';

@Component({
  selector: 'app-service-config',
  templateUrl: './service-config.component.html',
  styleUrls: ['./service-config.component.css']
})
export class ServiceConfigComponent implements OnInit {
    @Output() serviceConfigureModal = new EventEmitter<boolean>();
    @Input() from: string;

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
