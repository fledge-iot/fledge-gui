import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { PingService } from './ping.service';
import { SharedService } from './shared.service';

export const InterceptorSkipHeader = 'X-Skip-Interceptor';

@Injectable()
export class HttpsRequestInterceptor implements HttpInterceptor {

  constructor(private router: Router,
    private pingService: PingService, private sharedService: SharedService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.headers.has(InterceptorSkipHeader)) {
      const headers = req.headers.delete(InterceptorSkipHeader);
      return next.handle(req.clone({ headers }));
    } else {
      if (sessionStorage.getItem('token') != null) {
        req = req.clone({
          setHeaders: {
            authorization: sessionStorage.getItem('token'),
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
      }
      return next.handle(req).pipe(map((event: HttpEvent<any>) => {
        return event;
      }), catchError((err: any) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401 || err.status === 403) {
            sessionStorage.clear();
            this.router.navigate(['/login']);
          }
          return observableThrowError(err);
        }
      }), );
    }
  }
}
