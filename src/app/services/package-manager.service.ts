import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PackageManagerService {

  private GET_PYTHON_PACKAGES_URL = environment.BASE_URL + 'python/packages';
  private INSTALL_PYTHON_PACKAGE_URL = environment.BASE_URL + 'python/package';

  constructor(private http: HttpClient) { }


  public getPythonPackages() {
    return this.http.get(this.GET_PYTHON_PACKAGES_URL).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  public InstallPythonPackage(payload: any) {
    return this.http.post(`${this.INSTALL_PYTHON_PACKAGE_URL}`, payload).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

}
