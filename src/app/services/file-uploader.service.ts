import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root'
})
export class FileUploaderService {

  private CATEGORY_URL = environment.BASE_URL + 'category';
  constructor(private http: HttpClient, private alertService: AlertService) { }

  public uploadConfigurationScript(name: string, files: any[]) {
    files.forEach(data => {
      // get config item
      const [configProperty] = Object.entries(data)[0];
      // get file
      const file = data[configProperty];
      const formData = new FormData();
      formData.append('script', file);
      this.uploadFile(name, configProperty, formData)
        .subscribe(() => {
          this.alertService.success('Script uploaded successfully.');
        },
          error => {

            if (error.status === 0) {
              console.log('service down ', error);
            } else {
              this.alertService.error(error.statusText);
            }
          });
    });
  }

  getConfigurationPropertyFiles(configuration: any) {
    const files = [];
    if (configuration) {
      const keys = Object.keys(configuration).filter(k => (configuration[k] instanceof File));
      keys.forEach(k => {
        if (configuration.hasOwnProperty(k)) {
          files.push({ [k]: configuration[k] });
          delete configuration[k]; // delete object properties having value as file, from the changed object to update
        }
      })
    }
    return files;
  }

  /**
  *  POST  | /fledge/category/{categoryName}/{config_item}/upload
  */
  uploadFile(categoryName: string, configItem: string, fileToUpload) {
    return this.http.post(this.CATEGORY_URL + '/' + encodeURIComponent(categoryName) + '/'
      + encodeURIComponent(configItem) + '/upload', fileToUpload).pipe(
        map(response => response),
        catchError(error => throwError(error)));
  }

}
