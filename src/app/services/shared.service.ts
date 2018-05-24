import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class SharedService {
    public isUserLoggedIn: Subject<any> = new Subject<any>();
    public isLoginSkiped: Subject<boolean> = new Subject<boolean>();
}
