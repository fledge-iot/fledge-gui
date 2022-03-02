import { Component, HostListener, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DateFormatterPipe } from '../../../../pipes';
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
  image;

  timestamp: string;

  constructor(
    private dateFormatter: DateFormatterPipe,
    public assetService: AssetsService) { }

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
      .subscribe((data: any) => {
        if (data.length === 0) {
          console.log('No readings found.');
          return;
        }

        // reading timestamp
        this.timestamp = this.dateFormatter.transform(data[0].timestamp, 'HH:mm:ss')
        // Check if returned readings are of image type
        var imageExists = Object.keys(data[0].reading).some(function (k) {
          return typeof (data[0].reading[k]) === 'string' && data[0].reading[k].includes("__DPIMAGE");
        });
        if (imageExists) {
          // split image data
          const imageData = data[0].reading[assetCode].replace('__DPIMAGE:', '').split('_');

          // Get base64 raw string
          const base64Str_ = imageData[1];

          // Get width, height and depth of the image and convert values into Number
          const [width, height, depth] = imageData[0].split(',').map(Number);

          let arrayBufferView = null;
          if (depth === 8) {
            arrayBufferView = Uint8Array.from(atob(base64Str_), c => c.charCodeAt(0))
          } else if (depth === 16) {
            // FIX ME! test 16 bit raw image array
            // arrayBufferView = Uint16Array.from(atob(base64Str_), c => c.charCodeAt(0));
          } else if (depth === 24) {
            // FIX ME! test 24 bit raw image array
            // arrayBufferView = Uint8Array.from(atob(base64Str_), c => c.charCodeAt(0));
          } else {
            console.log(`Not supported, found ${depth}`);
            return;
          }

          this.processImage(arrayBufferView, { width, height, depth });
        }
      },
        error => {
          console.log('error in response', error);
        });

  }

  processImage(buffer, options: any = {}) {
    let view = null;
    let out = null;

    if (options.depth === 8) {
      view = new Uint8Array(buffer);
      out = new Uint8ClampedArray(buffer.byteLength * 4);
      // set alpha channel
      view.forEach((a, i) => out[(i * 4) + 3] = a);
    }

    // FIX ME
    if (options.depth === 16) {
      // view = new Uint16Array(buffer);
      // out = new Uint8ClampedArray(buffer.byteLength * 2);
      // // set alpha channel
      // view.forEach((a, i) => out[(i * 4) + 3] = a);
    }

    console.log('view', view.length);
    console.log('out', out.length);

    const canvas = document.createElement('canvas');
    canvas.width = options.width;
    canvas.height = options.height;

    const image = new ImageData(out, options.width, options.height)
    console.log('image', image);
    canvas.getContext('2d').putImageData(image, 0, 0);
    // if you want to save a png version
    this.image = canvas.toDataURL("image/png");
  }

  public ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

}
