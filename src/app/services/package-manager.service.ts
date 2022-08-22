import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PackageManagerService {

  private GET_PACKAGE_PACKAGES_URL = environment.BASE_URL + 'python/packages';

  constructor(private http: HttpClient) { }


  public getPythonPackages() {
    return this.http.get(this.GET_PACKAGE_PACKAGES_URL).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

}
