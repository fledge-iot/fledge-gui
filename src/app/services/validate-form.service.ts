import { Injectable } from '@angular/core';
import { ViewConfigItemComponent } from '../components/core/configuration-manager/view-config-item/view-config-item.component';

@Injectable({
  providedIn: 'root'
})
export class ValidateFormService {

  constructor() { }

  checkViewConfigItemFormValidity(viewComponent: ViewConfigItemComponent) {
    if (viewComponent !== undefined) {
      const isValidPassword = viewComponent.passwordMatched;
      const isValidJSON = viewComponent.isValidJson;
      const isValidFileExtension = viewComponent.isValidExtension;
      const isValidForm = viewComponent.form.valid;
      return isValidPassword && isValidForm && isValidJSON && isValidFileExtension;
    }
  }
}
