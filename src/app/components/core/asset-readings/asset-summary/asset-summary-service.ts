import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { AssetsService } from '../../../../services';

@Injectable()
export class AssetSummaryService {
    assetReadingSummary: Subject<Array<any>> = new Subject<Array<any>>();
    constructor(private assetService: AssetsService) { }

    public getReadingSummary(data: any) {
        const assetSummary = [];
        const keys = Object.keys(data.readings.reading);
        let count = 0;
        keys.forEach(key => {
            const assetObj: object = {
                assetCode: data.assetCode,
                reading: key,
                time: data.time
            };
            this.assetService.getAssetSummary(assetObj)
                .subscribe(
                summaryData => {
                    count++;
                    assetSummary.push({
                        assetCode: data.assetCode,
                        data: summaryData
                    });
                    if (count === keys.length) {
                        this.setAssetSummary(assetSummary);
                    }
                },
                error => {
                    if (error.status === 0) {
                        console.log('service down ', error);
                    } else {
                        console.log('error in response ', error);
                    }
                });
        });
    }

    public setAssetSummary(assetSummary) {
        const assetReadingSummary = [];
        assetSummary.forEach(summary => {
            const keys = Object.keys(summary.data);
            keys.forEach(key => {
                assetReadingSummary.push({ key: key, summary: [summary.data[key]] });
            });
        });
        this.assetReadingSummary.next(assetReadingSummary);
    }
}
