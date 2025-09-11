import { TestBed } from '@angular/core/testing';
import { ImageProcessingService } from './image-processing.service';

describe('ImageProcessingService', () => {
  let service: ImageProcessingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageProcessingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getImageDimensions', () => {
    it('should extract correct dimensions from valid image data', () => {
      const imageData = '__DPIMAGE:800,600,24_base64datahere';
      const result = service.getImageDimensions(imageData);

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.depth).toBe(24);
    });

    it('should handle invalid image data gracefully', () => {
      const imageData = 'invalid-data';
      const result = service.getImageDimensions(imageData);

      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
      expect(result.depth).toBe(0);
    });
  });

  describe('processImageReading', () => {
    it('should return empty string for unsupported depth', () => {
      const imageData = '__DPIMAGE:100,100,32_' + btoa('test');
      const result = service.processImageReading(imageData);

      expect(result).toBe('');
    });

    it('should handle invalid image data gracefully', () => {
      const imageData = 'invalid-data';
      const result = service.processImageReading(imageData);

      expect(result).toBe('');
    });

    it('should process valid 8-bit image data', () => {
      // Create minimal test data for 2x2 image
      const width = 2;
      const height = 2;
      const depth = 8;
      const pixels = new Uint8Array(width * height);
      pixels.fill(128); // Gray pixel value

      const base64Data = btoa(String.fromCharCode(...pixels));
      const imageData = `__DPIMAGE:${width},${height},${depth}_${base64Data}`;

      const result = service.processImageReading(imageData);

      expect(result).toContain('data:image/png;base64,');
    });

    it('should process valid 24-bit image data', () => {
      // Create minimal test data for 2x2 RGB image
      const width = 2;
      const height = 2;
      const depth = 24;
      const pixels = new Uint8Array(width * height * 3);
      // Fill with RGB values (red, green, blue, alpha for each pixel)
      for (let i = 0; i < pixels.length; i += 3) {
        pixels[i] = 255;     // Red
        pixels[i + 1] = 128; // Green
        pixels[i + 2] = 64;  // Blue
      }

      const base64Data = btoa(String.fromCharCode(...pixels));
      const imageData = `__DPIMAGE:${width},${height},${depth}_${base64Data}`;

      const result = service.processImageReading(imageData);

      expect(result).toContain('data:image/png;base64,');
    });
  });

  describe('processImageReadings', () => {
    it('should process array of readings with imageData', () => {
      const readings = [
        {
          id: 1,
          imageData: '__DPIMAGE:2,2,8_' + btoa('test'),
          timestamp: '2023-01-01T00:00:00Z'
        },
        {
          id: 2,
          someOtherData: 'no image',
          timestamp: '2023-01-01T00:01:00Z'
        }
      ];

      const result = service.processImageReadings(readings);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('image');
      expect(result[1]).not.toHaveProperty('image');
    });

    it('should handle empty array', () => {
      const result = service.processImageReadings([]);
      expect(result).toEqual([]);
    });

    it('should handle readings without imageData property', () => {
      const readings = [
        { id: 1, data: 'some data' },
        { id: 2, value: 123 }
      ];

      const result = service.processImageReadings(readings);

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('image');
      expect(result[1]).not.toHaveProperty('image');
    });
  });
}); 