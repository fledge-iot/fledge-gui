import { AbstractControl, FormControl, FormGroup } from '@angular/forms';

export class CustomValidator {
  static nospaceValidator(control: AbstractControl): { [s: string]: boolean } {
    if (control.value && control.value.trim() === '') {
      return { nospace: true };
    }
  }

  static validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  public static pluginsCountValidator(control: AbstractControl): { [s: string]: boolean } {
    const value = control.value;
    return value && value.length > 1 ? { multiplePlugins: true } : null;
  }
}
