import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';

@Injectable()
export class BackupRestoreService {
  public BACKUP_URL = environment.BASE_URL + 'backup';

  constructor(private http: HttpClient) { }

  /**
   *  GET | /foglamp/backup
   */
  public get() {
    return this.http.get(this.BACKUP_URL)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }
  
  /**
   *  POST | /foglamp/backup
   */
  public requestBackup() {
    return this.http.post(this.BACKUP_URL, null)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
   *  PUT | /foglamp/backup/{backup-id}/restore
   */
  public restoreBackup(id) {
    return this.http.put(this.BACKUP_URL + '/' + id + '/restore', null)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }
  
  /**
   *  DELETE | /foglamp/backup/{backup-id}
   */
  public deleteBackup(id) {
    return this.http.delete(this.BACKUP_URL + '/' + id)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }
}

