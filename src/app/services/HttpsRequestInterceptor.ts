import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

export const InterceptorSkipHeader = 'X-Skip-Interceptor';

@Injectable()
export class HttpsRequestInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (req.headers.has(InterceptorSkipHeader)) {
            const headers = req.headers.delete(InterceptorSkipHeader);
            return next.handle(req.clone({ headers }));
        } else {
            if (sessionStorage.getItem('token') != null) {
                req = req.clone({
                    setHeaders: {
                        authorization: sessionStorage.getItem('token')
                    }
                });
            }
            return next.handle(req);
        }
    }
}