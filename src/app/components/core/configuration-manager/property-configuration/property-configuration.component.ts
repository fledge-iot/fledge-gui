import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { RolesService } from '../../../../services';


@Component({
  selector: 'app-property-configuration',
  templateUrl: './property-configuration.component.html',
  styleUrls: ['./property-configuration.component.css']
})
export class PropertyConfigurationComponent {
  @Input() control: FormControl;
  @Input() configuration
  @Input() permissions = [];

  constructor(public rolesService: RolesService) { }

  togglePassword(input: any): any {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}
