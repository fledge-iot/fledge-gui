import { Component, HostListener, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AssetsService } from '../../../../services';

@Component({
  selector: 'app-image-visualisation',
  templateUrl: './image-visualisation.component.html',
  styleUrls: ['./image-visualisation.component.css']
})
export class ImageVisualisationComponent implements OnInit {
  showSpinner = true;
  assetCode = '';
  destroy$: Subject<boolean> = new Subject<boolean>();
  imageBase64String = '';
  imageUrl;

  constructor(
    public assetService: AssetsService,
    private domSanitizer: DomSanitizer) { }

  ngOnInit(): void { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.toggleModal(false);
  }

  public toggleModal(shouldOpen: Boolean) {
    const chart_modal = <HTMLDivElement>document.getElementById('image-control-modal');
    if (shouldOpen) {
      chart_modal.classList.add('is-active');
      return;
    }
    chart_modal.classList.remove('is-active');
  }

  public getAssetCode(assetCode: string) {
    this.assetCode = assetCode;
    this.getAssetReadings(assetCode);
  }

  getAssetReadings(assetCode) {
    this.assetService.getLatestReadings(assetCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any) => {
          console.log(data[0].reading);
          // TO TEST INITIAL IMAGE LOADING
          this.imageBase64String = data[0].reading['testcard'].split('8_')[1];
          console.log('this.base64Image', this.imageBase64String);
          this.imageUrl = this.domSanitizer.bypassSecurityTrustUrl('data:image/jpg;base64,' + this.imageBase64String);
        },
        error => {
          console.log('error in response', error);
        });
  }

  public ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

}
