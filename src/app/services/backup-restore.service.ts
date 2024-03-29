import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class BackupRestoreService {
  public BACKUP_URL = environment.BASE_URL + 'backup';

  constructor(private http: HttpClient) { }

  /**
   *  GET | /fledge/backup
   */
  public get() {
    return this.http.get(this.BACKUP_URL).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  POST | /fledge/backup
   */
  public requestBackup() {
    return this.http.post(this.BACKUP_URL, null).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  PUT | /fledge/backup/{backup-id}/restore
   */
  public restoreBackup(id) {
    return this.http.put(this.BACKUP_URL + '/' + id + '/restore', null).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
   *  DELETE | /fledge/backup/{backup-id}
   */
  public deleteBackup(id) {
    return this.http.delete(this.BACKUP_URL + '/' + id).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  public async downloadBackup(id): Promise<Blob> {
    const file = await this.http.get<Blob>(
      this.BACKUP_URL + '/' + id + '/download',
      { responseType: 'blob' as 'json' }).toPromise();
    return file;
  }

  public uploadBackup(file: File, fileName: string) {
    const formData = new FormData();
    formData.append('filename', file, fileName);
    return this.http.post(`${this.BACKUP_URL}/upload`, formData).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}

