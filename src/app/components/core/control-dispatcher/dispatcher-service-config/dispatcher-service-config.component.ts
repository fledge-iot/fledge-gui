import { Component, OnInit } from '@angular/core';
import { RolesService } from '../../../../services';

@Component({
  selector: 'app-dispatcher-service-config',
  templateUrl: './dispatcher-service-config.component.html',
  styleUrls: ['./dispatcher-service-config.component.css']
})
export class DispatcherServiceConfigComponent implements OnInit {
  constructor(
    public rolesService: RolesService) {}

  ngOnInit(): void {
  }
}

