import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { environment } from '../../environments/environment';

@Injectable()
export class AssetsService {
  private GET_ASSET = environment.BASE_URL + 'asset';

  constructor(private http: Http) { }

  /**
  * GET  | foglamp/asset
  * Return a summary count of all asset readings
  */
  public getAsset() {
    return this.http.get(this.GET_ASSET)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }

  /**
  *  /foglamp/asset/{asset_code}
  * @param asset_code
  * @param limit
  * @param offset
  *  Return a set of asset readings for the given asset code
  */
  public getAssetReadings(asset_code, limit: Number = 0, offset: Number = 0) {
    let _params = {};
    if (limit && offset) {
      _params = { params: { limit: limit, skip: offset } };

    } else if (limit) {
      _params = { params: { limit: limit } };
    } else if (offset) {  // offset works withOUT limit in postgres!
      _params = { params: { skip: offset } };
    }
    return this.http.get(this.GET_ASSET + '/' + asset_code, _params)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }

  public getAssetSummary(assetObject: any) {
    let _params = {};
    if (assetObject.time !== undefined ) {
      _params = { params: assetObject.time };
    }
    return this.http.get(this.GET_ASSET + '/' + encodeURIComponent(assetObject.asset_code)
      + '/' + assetObject.reading + '/summary', _params)
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }

  // TODO: Not in use yet
  public getAssetAverage(assetObject: any) {
    // TODO: time based readings average;
    return this.http.get(this.GET_ASSET + '/' + encodeURIComponent(assetObject.asset_code) + '/' + assetObject.reading + '/series')
      .map(response => response.json())
      .catch((error: Response) => Observable.throw(error.json().message || 'Server error'));
  }
}
