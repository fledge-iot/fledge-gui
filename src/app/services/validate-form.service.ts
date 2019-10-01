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
      const isValidForm = viewComponent.form.valid;
      if (!isValidPassword || !isValidForm) {
        return false;
      }
      return true;
    }
  }
}
