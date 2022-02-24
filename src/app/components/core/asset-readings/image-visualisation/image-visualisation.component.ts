import { Component, HostListener, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { decode, encode } from 'base64-arraybuffer';
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
          // TO TEST INITIAL IMAGE LOADING
          const base64 = data[0].reading['testcard'].split('8_')[1];
          var bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
          // var binary_string = window.atob(base64);
          // var len = binary_string.length;
          // var bytes = new Uint8Array(len);
          // for (var i = 0; i < len; i++) {
          //   bytes[i] = binary_string.charCodeAt(i);
          // }
          // console.log('base64', base64String);
          // const dataArray = decode(base64String);
          // const byte = new Uint8Array(dataArray);
          // console.log('bytes array', byte.buffer);
          const blob = new Blob([bytes.buffer], { type: 'image/png' });
          const imageUrl = URL.createObjectURL(blob);
          this.imageUrl = this.domSanitizer.bypassSecurityTrustUrl(imageUrl);
          console.log('img', this.imageUrl);
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
