import { Injectable } from '@angular/core';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ProcessedImageReading {
  imageUrl: string;
  dimensions: ImageDimensions & { depth: number };
}

@Injectable({
  providedIn: 'root'
})
export class ImageProcessingService {

  constructor() { }

  public processImageReading(imageData: string): string {
    try {
      const cleanImageData = imageData.replace('__DPIMAGE:', '').split('_');
      const base64Str = cleanImageData[1];
      const [width, height, depth] = cleanImageData[0].split(',').map(Number);

      let arrayBufferView = null;
      if (depth === 8) {
        arrayBufferView = Uint8Array.from(atob(base64Str), c => c.charCodeAt(0));
        return this.process8bitBitmap(arrayBufferView.buffer, { width, height });
      } else if (depth === 16) {
        arrayBufferView = Uint16Array.from(atob(base64Str), c => c.charCodeAt(0));
        return this.process16bitBitmap(arrayBufferView, { width, height });
      } else if (depth === 24) {
        arrayBufferView = Uint8Array.from(atob(base64Str), c => c.charCodeAt(0));
        return this.process24bitBitmap(arrayBufferView.buffer, { width, height });
      } else {
        console.log(`Image depth ${depth} not supported`);
        return '';
      }
    } catch (error) {
      console.error('Error processing image reading:', error);
      return '';
    }
  }

  public processImageReadings(readings: any[]): any[] {
    return readings.map((read) => {
      if (read.imageData) {
        read.image = this.processImageReading(read.imageData);
      }
      return read;
    });
  }

  public getImageDimensions(imageData: string): ImageDimensions & { depth: number } {
    try {
      const cleanImageData = imageData.replace('__DPIMAGE:', '').split('_');
      const [width, height, depth] = cleanImageData[0].split(',').map(Number);
      return { width, height, depth };
    } catch (error) {
      console.error('Error extracting image dimensions:', error);
      return { width: 0, height: 0, depth: 0 };
    }
  }

  private process8bitBitmap(buffer: ArrayBuffer, options: ImageDimensions): string {
    const view = new Uint8ClampedArray(buffer);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Could not get canvas context');
      return '';
    }

    ctx.canvas.width = options.width;
    ctx.canvas.height = options.height;
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    let x = 0;

    for (let i = 0; i < imgData.data.length; i += 4) {
      imgData.data[i] = view[x];     // Red
      imgData.data[i + 1] = view[x]; // Green
      imgData.data[i + 2] = view[x++]; // Blue
      imgData.data[i + 3] = 255;     // Alpha
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  }

  private process16bitBitmap(data: Uint16Array, options: ImageDimensions): string {
    const view = new Uint16Array(data.buffer);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Could not get canvas context');
      return '';
    }

    ctx.canvas.width = options.width;
    ctx.canvas.height = options.height;
    const imgData = ctx.createImageData(canvas.width, canvas.height);

    const max_uint16 = Math.pow(2, 16) - 1;
    const max_uint8 = Math.pow(2, 8) - 1;
    const uint16_to_uint8 = max_uint8 / max_uint16;
    let x = 0;

    for (let i = 0; i < imgData.data.length; i += 4) {
      const num_16 = (view[x + 1] * 256) + view[x];
      const num_scaled_8 = Math.round(num_16 * uint16_to_uint8);
      imgData.data[i] = num_scaled_8;     // Red
      imgData.data[i + 1] = num_scaled_8; // Green
      imgData.data[i + 2] = num_scaled_8; // Blue
      imgData.data[i + 3] = 255;          // Alpha
      x += 2;
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  }

  private process24bitBitmap(buffer: ArrayBuffer, options: ImageDimensions): string {
    const view = new Uint8ClampedArray(buffer);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Could not get canvas context');
      return '';
    }

    ctx.canvas.width = options.width;
    ctx.canvas.height = options.height;
    const imgData = ctx.createImageData(options.width, options.height);
    let x = 0;

    for (let i = 0; i < imgData.data.length; i += 4) {
      imgData.data[i + 0] = view[x++]; // Red
      imgData.data[i + 1] = view[x++]; // Green
      imgData.data[i + 2] = view[x++]; // Blue
      imgData.data[i + 3] = 255;       // Alpha
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  }
} 